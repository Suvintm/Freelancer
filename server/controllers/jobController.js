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
  } = req.body;

  // Validate required fields
  if (!title || !description || !category || !budget?.min || !budget?.max || !applicationDeadline) {
    throw new ApiError(400, "Missing required fields");
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
  const { coverMessage, expectedRate } = req.body;
  const jobId = req.params.id;

  // Check if user is an editor
  if (req.user.role !== "editor") {
    throw new ApiError(403, "Only editors can apply to jobs");
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
    .populate("applicant", "name email phone");

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

  // Mark job as filled (optional - client can hire multiple)
  // application.job.status = "filled";
  // await application.job.save();

  // Send email to editor
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366F1;">🎉 Congratulations!</h1>
      <p>Hi ${application.applicant.name},</p>
      <p>Great news! <strong>${req.user.name}</strong> has selected you for the job:</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin: 0 0 8px 0;">${application.job.title}</h3>
        <p style="margin: 0; color: #6b7280;">Budget: ₹${application.job.budget.min} - ₹${application.job.budget.max}</p>
      </div>
      <h3>Contact the client to discuss next steps:</h3>
      <ul>
        <li>📧 Email: <a href="mailto:${req.user.email}">${req.user.email}</a></li>
        ${req.user.phone ? `<li>📱 Phone: ${req.user.phone}</li>` : ""}
      </ul>
      <p>Best of luck with this opportunity!</p>
      <p>— Team Suvix</p>
    </div>
  `;

  try {
    await sendEmail({
      to: application.applicant.email,
      subject: `🎉 You've been selected for "${application.job.title}" - Suvix`,
      html: emailHtml,
    });
  } catch (emailErr) {
    logger.error(`Failed to send hire email: ${emailErr.message}`);
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
    message: "Editor hired successfully! They have been notified via email.",
    application,
    editorContact: {
      name: application.applicant.name,
      email: application.applicant.email,
      phone: application.applicant.phone,
      portfolioUrl: application.portfolioUrl,
      suvixProfileUrl: application.suvixProfileUrl,
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
      select: "title category budget status postedBy applicationDeadline",
      populate: { path: "postedBy", select: "name profilePicture" },
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
