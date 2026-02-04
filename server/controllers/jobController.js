/**
 * Job Controller - Handles job posting and hiring operations
 */

import { Job } from "../models/Job.js";
import { JobApplication } from "../models/JobApplication.js";
import User from "../models/User.js";
import { Profile } from "../models/Profile.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import { createNotification } from "./notificationController.js";
import { sendEmail } from "../utils/emailService.js";
import logger from "../utils/logger.js";

// ============ CREATE JOB ============
export const createJob = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    skillsRequired,
    experienceLevel,
    workType,
    location,
    budget,
    hiringRounds,
    roundNames,
    applicationDeadline,
    expectedStartDate,
    isUrgent,
    maxApplicants,
    clientContact,
  } = req.body;

  // Validate required fields
  if (!title || !description || !category || !budget?.min || !budget?.max || !applicationDeadline) {
    throw new ApiError(400, "Missing required fields");
  }

  // Validate client contact
  if (!clientContact?.email) {
    throw new ApiError(400, "Contact email is required");
  }

  // Set round names based on number of rounds
  let finalRoundNames = roundNames;
  if (!roundNames || roundNames.length !== hiringRounds) {
    const defaultRounds = {
      1: ["Direct Hire"],
      2: ["Screening", "Final Selection"],
      3: ["Screening", "Trial/Interview", "Final Selection"],
    };
    finalRoundNames = defaultRounds[hiringRounds] || ["Direct Hire"];
  }

  const job = await Job.create({
    postedBy: req.user._id,
    title: title.trim(),
    description: description.trim(),
    category,
    skillsRequired: skillsRequired || [],
    experienceLevel: experienceLevel || "fresher",
    workType: workType || "remote",
    location: location || {},
    budget,
    hiringRounds: hiringRounds || 1,
    roundNames: finalRoundNames,
    applicationDeadline: new Date(applicationDeadline),
    expectedStartDate: expectedStartDate ? new Date(expectedStartDate) : null,
    isUrgent: isUrgent || false,
    maxApplicants: maxApplicants || 100,
    status: "active",
    clientContact: {
      email: clientContact.email.trim().toLowerCase(),
      phone: clientContact.phone?.trim() || null,
      whatsapp: clientContact.whatsapp?.trim() || null,
      instagram: clientContact.instagram?.trim() || null,
      twitter: clientContact.twitter?.trim() || null,
      linkedin: clientContact.linkedin?.trim() || null,
      preferredContact: clientContact.preferredContact || "email",
    },
  });

  logger.info(`Job created: ${job._id} by user ${req.user._id}`);

  res.status(201).json({
    success: true,
    message: "Job posted successfully",
    job,
  });
});

// ============ GET ALL JOBS (PUBLIC) ============
export const getJobs = asyncHandler(async (req, res) => {
  const {
    category,
    workType,
    experienceLevel,
    skills,
    minBudget,
    maxBudget,
    location,
    search,
    sortBy = "newest",
    page = 1,
    limit = 12,
  } = req.query;

  const query = { status: "active" };

  // Filters
  if (category) query.category = category;
  if (workType) query.workType = workType;
  if (experienceLevel) query.experienceLevel = experienceLevel;
  if (skills) {
    const skillsArray = skills.split(",");
    query.skillsRequired = { $in: skillsArray };
  }
  if (minBudget || maxBudget) {
    query["budget.min"] = minBudget ? { $gte: Number(minBudget) } : undefined;
    query["budget.max"] = maxBudget ? { $lte: Number(maxBudget) } : undefined;
  }
  if (location) {
    query["location.city"] = { $regex: location, $options: "i" };
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Sort options
  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "budget-high": { "budget.max": -1 },
    "budget-low": { "budget.min": 1 },
    urgent: { isUrgent: -1, createdAt: -1 },
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .populate("postedBy", "name profilePicture")
      .sort(sortOptions[sortBy] || sortOptions.newest)
      .skip(skip)
      .limit(Number(limit)),
    Job.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    jobs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ============ GET SINGLE JOB ============
export const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate("postedBy", "name profilePicture email");

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  // Increment view count
  job.viewCount += 1;
  await job.save();

  // Check if current user has applied (if authenticated)
  let hasApplied = false;
  let applicationStatus = null;
  if (req.user) {
    const application = await JobApplication.findOne({
      job: job._id,
      applicant: req.user._id,
    });
    if (application) {
      hasApplied = true;
      applicationStatus = application.status;
    }
  }

  res.status(200).json({
    success: true,
    job,
    hasApplied,
    applicationStatus,
  });
});

// ============ UPDATE JOB ============
export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to update this job");
  }

  const allowedUpdates = [
    "title", "description", "category", "skillsRequired", "experienceLevel",
    "workType", "location", "budget", "applicationDeadline", "expectedStartDate",
    "isUrgent", "maxApplicants",
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      job[field] = req.body[field];
    }
  });

  await job.save();

  logger.info(`Job updated: ${job._id}`);

  res.status(200).json({
    success: true,
    message: "Job updated successfully",
    job,
  });
});

// ============ UPDATE JOB STATUS ============
export const updateJobStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  const validTransitions = {
    draft: ["active"],
    active: ["paused", "closed", "filled"],
    paused: ["active", "closed"],
    closed: ["active"],
    filled: [],
  };

  if (!validTransitions[job.status]?.includes(status)) {
    throw new ApiError(400, `Cannot change status from ${job.status} to ${status}`);
  }

  job.status = status;
  await job.save();

  res.status(200).json({
    success: true,
    message: `Job status changed to ${status}`,
    job,
  });
});

// ============ DELETE JOB ============
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  await Job.findByIdAndDelete(req.params.id);
  await JobApplication.deleteMany({ job: req.params.id });

  logger.info(`Job deleted: ${req.params.id}`);

  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
  });
});

// ============ GET MY POSTED JOBS ============
export const getMyJobs = asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  const query = { postedBy: req.user._id };
  if (status && status !== "all") {
    query.status = status;
  }

  const jobs = await Job.find(query)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    jobs,
  });
});

// ============ APPLY TO JOB ============
export const applyToJob = asyncHandler(async (req, res) => {
  const { coverMessage, expectedRate, editorContact } = req.body;
  const jobId = req.params.id;

  // Check if user is an editor
  if (req.user.role !== "editor") {
    throw new ApiError(403, "Only editors can apply to jobs");
  }

  // Validate editor contact
  if (!editorContact?.email) {
    throw new ApiError(400, "Contact email is required");
  }

  // Get job
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.status !== "active") {
    throw new ApiError(400, "This job is not accepting applications");
  }

  if (new Date() > job.applicationDeadline) {
    throw new ApiError(400, "Application deadline has passed");
  }

  if (job.applicantCount >= job.maxApplicants) {
    throw new ApiError(400, "Maximum applicants reached for this job");
  }

  // Check if already applied
  const existingApplication = await JobApplication.findOne({
    job: jobId,
    applicant: req.user._id,
  });

  if (existingApplication) {
    throw new ApiError(400, "You have already applied to this job");
  }

  // Get editor's portfolio URL
  const editorProfile = await Profile.findOne({ user: req.user._id });
  const portfolioUrl = editorProfile?.socialLinks?.website || 
                       editorProfile?.socialLinks?.youtube || 
                       `${process.env.FRONTEND_URL}/public-profile/${req.user._id}`;

  // Create application
  const application = await JobApplication.create({
    job: jobId,
    applicant: req.user._id,
    coverMessage: coverMessage?.trim() || "",
    portfolioUrl,
    suvixProfileUrl: `${process.env.FRONTEND_URL}/public-profile/${req.user._id}`,
    expectedRate: Number(expectedRate),
    status: "applied",
    statusHistory: [{ status: "applied", changedAt: new Date() }],
    editorContact: {
      email: editorContact.email.trim().toLowerCase(),
      phone: editorContact.phone?.trim() || null,
      whatsapp: editorContact.whatsapp?.trim() || null,
      instagram: editorContact.instagram?.trim() || null,
      youtube: editorContact.youtube?.trim() || null,
      twitter: editorContact.twitter?.trim() || null,
      linkedin: editorContact.linkedin?.trim() || null,
      website: editorContact.website?.trim() || null,
      preferredContact: editorContact.preferredContact || "email",
    },
  });

  // Update job applicant count
  job.applicantCount += 1;
  await job.save();

  // Notify job poster
  await createNotification({
    recipient: job.postedBy,
    type: "info",
    title: "New Job Application",
    message: `${req.user.name} applied for "${job.title}"`,
    link: `/my-jobs/${job._id}/applicants`,
  });

  logger.info(`Application submitted: ${application._id} for job ${jobId}`);

  res.status(201).json({
    success: true,
    message: "Application submitted successfully",
    application,
  });
});

// ============ GET JOB APPLICATIONS (FOR JOB POSTER) ============
export const getJobApplications = asyncHandler(async (req, res) => {
  const jobId = req.params.id;
  const { status } = req.query;

  // Verify ownership
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to view applicants");
  }

  const query = { job: jobId };
  if (status && status !== "all") {
    query.status = status;
  }

  const applications = await JobApplication.find(query)
    .populate({
      path: "applicant",
      select: "name email profilePicture phone",
    })
    .sort({ createdAt: -1 });

  // Enrich with editor profile data
  const enrichedApplications = await Promise.all(
    applications.map(async (app) => {
      const editorProfile = await Profile.findOne({ user: app.applicant._id })
        .select("skills experience ratingStats about");
      
      return {
        ...app.toObject(),
        editorProfile,
      };
    })
  );

  res.status(200).json({
    success: true,
    applications: enrichedApplications,
    job: {
      title: job.title,
      roundNames: job.roundNames,
      hiringRounds: job.hiringRounds,
    },
  });
});

// ============ UPDATE APPLICATION STATUS ============
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const applicationId = req.params.applicationId;

  const application = await JobApplication.findById(applicationId)
    .populate("job")
    .populate("applicant", "name email");

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  // Verify job ownership
  if (application.job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  const validStatuses = ["applied", "shortlisted", "round1", "round2", "round3", "hired", "rejected"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  application.status = status;
  if (note) application.clientNotes = note;
  
  if (status === "hired") {
    application.hiredAt = new Date();
  } else if (status === "rejected") {
    application.rejectedAt = new Date();
    application.rejectionReason = note || "Not selected";
  }

  await application.save();

  // Notify applicant
  const notificationMessages = {
    shortlisted: `Good news! You've been shortlisted for "${application.job.title}"`,
    round1: `You've advanced to Round 1 for "${application.job.title}"`,
    round2: `You've advanced to Round 2 for "${application.job.title}"`,
    round3: `You've advanced to the final round for "${application.job.title}"`,
    hired: `🎉 Congratulations! You've been selected for "${application.job.title}"`,
    rejected: `Update on your application for "${application.job.title}"`,
  };

  if (notificationMessages[status]) {
    await createNotification({
      recipient: application.applicant._id,
      type: status === "hired" ? "success" : status === "rejected" ? "warning" : "info",
      title: status === "hired" ? "You're Hired!" : "Application Update",
      message: notificationMessages[status],
      link: "/my-applications",
    });
  }

  logger.info(`Application ${applicationId} status updated to ${status}`);

  res.status(200).json({
    success: true,
    message: `Application status updated to ${status}`,
    application,
  });
});

// ============ HIRE EDITOR (FINAL ACTION) ============
export const hireEditor = asyncHandler(async (req, res) => {
  const applicationId = req.params.applicationId;

  const application = await JobApplication.findById(applicationId)
    .populate("job")
    .populate("applicant", "name email profilePicture");

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  // Verify job ownership
  if (application.job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  application.status = "hired";
  application.hiredAt = new Date();
  await application.save();

  // Get client and editor contact details
  const clientContact = application.job.clientContact;
  const editorContact = application.editorContact;

  // Helper to format contact list for email
  const formatContactHtml = (contact, isEditor = false) => {
    let html = `<ul style="list-style: none; padding: 0; margin: 16px 0;">`;
    
    if (contact.email) {
      html += `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        📧 <strong>Email:</strong> <a href="mailto:${contact.email}" style="color: #6366F1;">${contact.email}</a>
        ${contact.preferredContact === "email" ? '<span style="margin-left: 8px; padding: 2px 8px; background: #10b981; color: white; font-size: 10px; border-radius: 10px;">Preferred</span>' : ''}
      </li>`;
    }
    
    if (contact.phone) {
      html += `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        📱 <strong>Phone:</strong> <a href="tel:${contact.phone}" style="color: #6366F1;">${contact.phone}</a>
        ${contact.preferredContact === "phone" ? '<span style="margin-left: 8px; padding: 2px 8px; background: #10b981; color: white; font-size: 10px; border-radius: 10px;">Preferred</span>' : ''}
      </li>`;
    }
    
    if (contact.whatsapp) {
      html += `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        💬 <strong>WhatsApp:</strong> <a href="https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}" style="color: #6366F1;">${contact.whatsapp}</a>
        ${contact.preferredContact === "whatsapp" ? '<span style="margin-left: 8px; padding: 2px 8px; background: #10b981; color: white; font-size: 10px; border-radius: 10px;">Preferred</span>' : ''}
      </li>`;
    }
    
    if (contact.instagram) {
      html += `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">📸 <strong>Instagram:</strong> <a href="https://instagram.com/${contact.instagram.replace('@', '')}" style="color: #6366F1;">@${contact.instagram.replace('@', '')}</a></li>`;
    }
    
    if (isEditor && contact.youtube) {
      html += `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">📺 <strong>YouTube:</strong> <a href="${contact.youtube}" style="color: #6366F1;">${contact.youtube}</a></li>`;
    }
    
    if (contact.linkedin) {
      html += `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">💼 <strong>LinkedIn:</strong> <a href="${contact.linkedin}" style="color: #6366F1;">${contact.linkedin}</a></li>`;
    }
    
    if (contact.twitter) {
      html += `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">🐦 <strong>Twitter:</strong> <a href="https://twitter.com/${contact.twitter.replace('@', '')}" style="color: #6366F1;">@${contact.twitter.replace('@', '')}</a></li>`;
    }
    
    if (isEditor && contact.website) {
      html += `<li style="padding: 8px 0;">🌐 <strong>Website:</strong> <a href="${contact.website}" style="color: #6366F1;">${contact.website}</a></li>`;
    }
    
    html += `</ul>`;
    return html;
  };

  // Email to Editor with Client Contact
  const editorEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px;">
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 48px;">🎉</div>
          <h1 style="color: #111827; margin: 16px 0 8px;">Congratulations!</h1>
          <p style="color: #6b7280; margin: 0;">You've been hired!</p>
        </div>
        
        <p style="color: #374151;">Hi <strong>${application.applicant.name}</strong>,</p>
        <p style="color: #374151;">Great news! <strong>${req.user.name}</strong> has selected you for:</p>
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #6366F1;">
          <h3 style="margin: 0 0 8px 0; color: #111827;">${application.job.title}</h3>
          <p style="margin: 0; color: #6b7280;">Budget: ₹${application.job.budget.min?.toLocaleString()} - ₹${application.job.budget.max?.toLocaleString()}</p>
        </div>
        
        <h3 style="color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">📋 Client Contact Details</h3>
        ${formatContactHtml(clientContact, false)}
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-top: 24px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⚠️ Important:</strong> SuviX has facilitated this connection. All further communication, agreements, and payments are directly between you and the client. Please discuss project details, timelines, and payment terms directly.
          </p>
        </div>
        
        <p style="color: #6b7280; margin-top: 24px;">Best of luck with this opportunity!</p>
        <p style="color: #374151;">— Team SuviX</p>
      </div>
    </div>
  `;

  // Email to Client with Editor Contact
  const clientEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px;">
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 48px;">✅</div>
          <h1 style="color: #111827; margin: 16px 0 8px;">Editor Hired Successfully!</h1>
          <p style="color: #6b7280; margin: 0;">Here are the contact details</p>
        </div>
        
        <p style="color: #374151;">Hi <strong>${req.user.name}</strong>,</p>
        <p style="color: #374151;">You have successfully hired <strong>${application.applicant.name}</strong> for:</p>
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #10b981;">
          <h3 style="margin: 0 0 8px 0; color: #111827;">${application.job.title}</h3>
          <p style="margin: 0; color: #6b7280;">Agreed Rate: ₹${application.expectedRate?.toLocaleString()}</p>
        </div>
        
        <h3 style="color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">� Editor Contact Details</h3>
        ${formatContactHtml(editorContact, true)}
        
        <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin-top: 16px;">
          <p style="margin: 0 0 8px 0; color: #166534; font-weight: bold;">📁 Portfolio & Profile</p>
          <p style="margin: 0; color: #166534; font-size: 14px;">
            <a href="${application.suvixProfileUrl}" style="color: #6366F1;">View SuviX Profile →</a>
          </p>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-top: 24px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⚠️ Important:</strong> SuviX has facilitated this connection. All further communication, agreements, and payments are directly between you and the editor. Please discuss project details, timelines, and payment terms directly.
          </p>
        </div>
        
        <p style="color: #6b7280; margin-top: 24px;">We hope this collaboration is a success!</p>
        <p style="color: #374151;">— Team SuviX</p>
      </div>
    </div>
  `;

  // Send emails
  try {
    await Promise.all([
      sendEmail({
        to: application.applicant.email,
        subject: `🎉 You've been hired for "${application.job.title}" - SuviX`,
        html: editorEmailHtml,
      }),
      sendEmail({
        to: req.user.email,
        subject: `✅ Editor hired for "${application.job.title}" - Contact Details Inside`,
        html: clientEmailHtml,
      }),
    ]);
  } catch (emailErr) {
    logger.error(`Failed to send hire emails: ${emailErr.message}`);
  }

  // In-app notification
  await createNotification({
    recipient: application.applicant._id,
    type: "success",
    title: "🎉 You're Hired!",
    message: `${req.user.name} selected you for "${application.job.title}". Check your email for contact details.`,
    link: "/my-applications",
  });

  logger.info(`Editor ${application.applicant._id} hired for job ${application.job._id}`);

  res.status(200).json({
    success: true,
    message: "Editor hired successfully! Both parties have been notified via email.",
    application,
    editorContact: {
      name: application.applicant.name,
      profilePicture: application.applicant.profilePicture,
      ...editorContact,
      portfolioUrl: application.portfolioUrl,
      suvixProfileUrl: application.suvixProfileUrl,
    },
    clientContact: {
      name: req.user.name,
      ...clientContact,
    },
  });
});

// ============ GET MY APPLICATIONS (EDITOR) ============
export const getMyApplications = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const query = { applicant: req.user._id };
  if (status && status !== "all") {
    query.status = status;
  }

  const applications = await JobApplication.find(query)
    .populate({
      path: "job",
      select: "title category budget status postedBy applicationDeadline clientContact",
      populate: { path: "postedBy", select: "name profilePicture email phone" },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    applications,
  });
});

// ============ WITHDRAW APPLICATION ============
export const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.applicationId);

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  if (application.applicant.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  if (application.status === "hired") {
    throw new ApiError(400, "Cannot withdraw after being hired");
  }

  application.status = "withdrawn";
  await application.save();

  // Decrement applicant count
  await Job.findByIdAndUpdate(application.job, { $inc: { applicantCount: -1 } });

  res.status(200).json({
    success: true,
    message: "Application withdrawn",
  });
});

// ============ GET JOB STATS (FOR DASHBOARD) ============
export const getJobStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [
    totalJobs,
    activeJobs,
    totalApplications,
    hiredCount,
  ] = await Promise.all([
    Job.countDocuments({ postedBy: userId }),
    Job.countDocuments({ postedBy: userId, status: "active" }),
    JobApplication.countDocuments({
      job: { $in: await Job.find({ postedBy: userId }).distinct("_id") },
    }),
    JobApplication.countDocuments({
      job: { $in: await Job.find({ postedBy: userId }).distinct("_id") },
      status: "hired",
    }),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalJobs,
      activeJobs,
      totalApplications,
      hiredCount,
    },
  });
});

// ============ GET PREVIOUS CONTACT DETAILS (FOR SUGGESTIONS) ============
export const getPreviousContact = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  let previousContact = null;

  if (userRole === "client") {
    // Get contact from most recent job posted by this client
    const lastJob = await Job.findOne({ postedBy: userId })
      .sort({ createdAt: -1 })
      .select("clientContact");
    
    if (lastJob?.clientContact) {
      previousContact = lastJob.clientContact;
    }
  } else if (userRole === "editor") {
    // Get contact from most recent application by this editor
    const lastApplication = await JobApplication.findOne({ applicant: userId })
      .sort({ createdAt: -1 })
      .select("editorContact");
    
    if (lastApplication?.editorContact) {
      previousContact = lastApplication.editorContact;
    }
  }

  // If no previous contact, return user's email as default
  if (!previousContact) {
    previousContact = {
      email: req.user.email,
      phone: null,
      whatsapp: null,
      instagram: null,
      youtube: null,
      twitter: null,
      linkedin: null,
      website: null,
      preferredContact: "email",
    };
  }

  res.status(200).json({
    success: true,
    previousContact,
    hasPreviousContact: !!previousContact.phone || !!previousContact.whatsapp,
  });
});
