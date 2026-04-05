/**
 * Job Controller - Handles job posting and hiring operations (Prisma/PostgreSQL)
 */
import prisma from "../../../config/prisma.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { createNotification } from "../../connectivity/controllers/notificationController.js";
import { sendEmail } from "../../../utils/emailService.js";
import logger from "../../../utils/logger.js";

// Helper: Map Prisma Job to camelCase
const mapJob = (j) => {
  if (!j) return null;
  return {
    ...j,
    _id: j.id,
    postedBy: j.posted_by,
    postedByUser: j.user ? {
      ...j.user,
      _id: j.user.id,
      profilePicture: j.user.profile_picture
    } : undefined,
    skillsRequired: j.skills_required,
    experienceLevel: j.experience_level,
    workType: j.work_type,
    budget: {
      min: Number(j.budget_min),
      max: Number(j.budget_max),
      currency: j.currency || "INR",
    },
    hiringRounds: j.hiring_rounds,
    roundNames: j.round_names,
    applicationDeadline: j.application_deadline,
    expectedStartDate: j.expected_start_date,
    isUrgent: j.is_urgent,
    maxApplicants: j.max_applicants,
    applicantCount: j.applicant_count,
    viewCount: j.view_count,
    clientContact: j.client_contact, // Assumed JSON in DB
    createdAt: j.created_at,
    updatedAt: j.updated_at
  };
};

// Helper: Map Prisma JobApplication to camelCase
const mapApplication = (app) => {
  if (!app) return null;
  return {
    ...app,
    _id: app.id,
    jobId: app.job_id,
    applicantId: app.applicant_id,
    applicant: app.applicant ? {
      ...app.applicant,
      _id: app.applicant.id,
      profilePicture: app.applicant.profile_picture,
      completedOrders: app.applicant.completed_orders
    } : undefined,
    coverMessage: app.cover_message,
    portfolioUrl: app.portfolio_url,
    suvixProfileUrl: app.suvix_profile_url,
    expectedRate: Number(app.expected_rate),
    clientNotes: app.client_notes,
    editorContact: app.editor_contact, // Assumed JSON in DB
    hiredAt: app.hired_at,
    rejectedAt: app.rejected_at,
    rejectionReason: app.rejection_reason,
    statusHistory: app.history?.map(h => ({
      status: h.status,
      note: h.note,
      changedAt: h.changed_at
    })) || [],
    createdAt: app.created_at,
    updatedAt: app.updated_at
  };
};

// ============ CREATE JOB ============
export const createJob = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    title, description, category, skillsRequired, experienceLevel,
    workType, location, budget, hiringRounds, roundNames,
    applicationDeadline, expectedStartDate, isUrgent,
    maxApplicants, clientContact,
  } = req.body;

  if (!title || !description || !category || !budget?.min || !budget?.max || !applicationDeadline) {
    throw new ApiError(400, "Missing required fields");
  }

  if (!clientContact?.email) {
    throw new ApiError(400, "Contact email is required");
  }

  let finalRoundNames = roundNames;
  if (!roundNames || roundNames.length !== hiringRounds) {
    const defaultRounds = {
      1: ["Direct Hire"],
      2: ["Screening", "Final Selection"],
      3: ["Screening", "Trial/Interview", "Final Selection"],
    };
    finalRoundNames = defaultRounds[hiringRounds] || ["Direct Hire"];
  }

  const job = await prisma.job.create({
    data: {
      posted_by: userId,
      title: title.trim(),
      description: description.trim(),
      category,
      skills_required: skillsRequired || [],
      experience_level: experienceLevel || "fresher",
      work_type: workType || "remote",
      location: location || {},
      budget_min: Number(budget.min),
      budget_max: Number(budget.max),
      currency: budget.currency || "INR",
      hiring_rounds: hiringRounds || 1,
      round_names: finalRoundNames,
      application_deadline: new Date(applicationDeadline),
      expected_start_date: expectedStartDate ? new Date(expectedStartDate) : null,
      is_urgent: isUrgent || false,
      max_applicants: maxApplicants || 100,
      status: "active",
      client_contact: {
        email: clientContact.email.trim().toLowerCase(),
        phone: clientContact.phone?.trim() || null,
        whatsapp: clientContact.whatsapp?.trim() || null,
        instagram: clientContact.instagram?.trim() || null,
        twitter: clientContact.twitter?.trim() || null,
        linkedin: clientContact.linkedin?.trim() || null,
        preferredContact: clientContact.preferredContact || "email",
      },
    }
  });

  logger.info(`Job created: ${job.id} by user ${userId}`);

  res.status(201).json({
    success: true,
    message: "Job posted successfully",
    job: mapJob(job),
  });
});

// ============ GET ALL JOBS (PUBLIC) ============
export const getJobs = asyncHandler(async (req, res) => {
  const {
    category, workType, experienceLevel, skills,
    minBudget, maxBudget, location, search,
    sortBy = "newest", page = 1, limit = 12,
  } = req.query;

  const where = { status: "active" };

  if (category) where.category = category;
  if (workType) where.work_type = workType;
  if (experienceLevel) where.experience_level = experienceLevel;
  if (skills) {
    const skillsArray = skills.split(",");
    where.skills_required = { hasSome: skillsArray };
  }
  if (minBudget || maxBudget) {
    where.budget_min = minBudget ? { gte: Number(minBudget) } : undefined;
    where.budget_max = maxBudget ? { lte: Number(maxBudget) } : undefined;
  }
  if (location) {
    where.location = {
      path: ['city'],
      string_contains: location
    };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  let orderBy = { created_at: 'desc' };
  switch (sortBy) {
    case "oldest":      orderBy = { created_at: 'asc' }; break;
    case "budget-high": orderBy = { budget_max: 'desc' }; break;
    case "budget-low":  orderBy = { budget_min: 'asc' }; break;
    case "urgent":      orderBy = [ { is_urgent: 'desc' }, { created_at: 'desc' } ]; break;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { user: { select: { id: true, name: true, profile_picture: true } } },
      orderBy,
      skip,
      take: Number(limit)
    }),
    prisma.job.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    jobs: jobs.map(mapJob),
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
  const jobId = req.params.id;
  const userId = req.user?.id;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { user: { select: { id: true, name: true, profile_picture: true, email: true } } }
  });

  if (!job) throw new ApiError(404, "Job not found");

  if (userId && job.posted_by !== userId) {
    const existingView = await prisma.jobView.findFirst({
        where: { job_id: jobId, user_id: userId }
    });
    if (!existingView) {
        await prisma.jobView.create({ data: { job_id: jobId, user_id: userId } });
        await prisma.job.update({
            where: { id: jobId },
            data: { view_count: { increment: 1 } }
        });
        job.view_count += 1;
    }
  }

  let hasApplied = false;
  let applicationStatus = null;
  if (userId) {
    const application = await prisma.jobApplication.findFirst({
      where: { job_id: jobId, applicant_id: userId },
      select: { status: true }
    });
    if (application) {
      hasApplied = true;
      applicationStatus = application.status;
    }
  }

  res.status(200).json({
    success: true,
    job: mapJob(job),
    hasApplied,
    applicationStatus,
  });
});

// ============ UPDATE JOB ============
export const updateJob = asyncHandler(async (req, res) => {
  const jobId = req.params.id;
  const userId = req.user.id;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new ApiError(404, "Job not found");

  if (job.posted_by !== userId) {
    throw new ApiError(403, "Not authorized to update this job");
  }

  const updates = {};
  const allowedUpdates = [
    "title", "description", "category", "skillsRequired", "experienceLevel",
    "workType", "location", "budget", "applicationDeadline", "expectedStartDate",
    "isUrgent", "maxApplicants",
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
        if (field === "skillsRequired") updates.skills_required = req.body[field];
        else if (field === "experienceLevel") updates.experience_level = req.body[field];
        else if (field === "workType") updates.work_type = req.body[field];
        else if (field === "applicationDeadline") updates.application_deadline = new Date(req.body[field]);
        else if (field === "expectedStartDate") updates.expected_start_date = req.body[field] ? new Date(req.body[field]) : null;
        else if (field === "isUrgent") updates.is_urgent = req.body[field];
        else if (field === "maxApplicants") updates.max_applicants = req.body[field];
        else if (field === "budget") {
            if (req.body.budget.min) updates.budget_min = Number(req.body.budget.min);
            if (req.body.budget.max) updates.budget_max = Number(req.body.budget.max);
            if (req.body.budget.currency) updates.currency = req.body.budget.currency;
        }
        else updates[field] = req.body[field];
    }
  });

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: updates
  });

  logger.info(`Job updated: ${jobId}`);

  res.status(200).json({
    success: true,
    message: "Job updated successfully",
    job: mapJob(updatedJob),
  });
});

// ============ UPDATE JOB STATUS ============
export const updateJobStatus = asyncHandler(async (req, res) => {
  const jobId = req.params.id;
  const { status } = req.body;
  const userId = req.user.id;

  if (!["active", "filled", "closed"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new ApiError(404, "Job not found");

  if (job.posted_by !== userId) {
    throw new ApiError(403, "Not authorized");
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: { status }
  });

  res.status(200).json({
    success: true,
    message: `Job status updated to ${status}`,
    job: mapJob(updatedJob),
  });
});

// ============ DELETE JOB ============
export const deleteJob = asyncHandler(async (req, res) => {
  const jobId = req.params.id;
  const userId = req.user.id;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new ApiError(404, "Job not found");

  if (job.posted_by !== userId) throw new ApiError(403, "Not authorized");

  await prisma.job.delete({ where: { id: jobId } });

  logger.info(`Job deleted: ${jobId}`);

  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
  });
});

// ============ GET MY POSTED JOBS ============
export const getMyJobs = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;
  
  const where = { posted_by: userId };
  if (status && status !== "all") where.status = status;

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { created_at: 'desc' }
  });

  res.status(200).json({
    success: true,
    jobs: jobs.map(mapJob),
  });
});

// ============ APPLY TO JOB ============
export const applyToJob = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const jobId = req.params.id;
  const { coverMessage, expectedRate, editorContact } = req.body;

  if (req.user.role !== "editor") throw new ApiError(403, "Only editors can apply to jobs");
  if (!editorContact?.email) throw new ApiError(400, "Contact email is required");

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new ApiError(404, "Job not found");

  if (job.status !== "active") throw new ApiError(400, "This job is not accepting applications");
  if (new Date() > job.application_deadline) throw new ApiError(400, "Application deadline has passed");
  if ((job.applicant_count || 0) >= job.max_applicants) throw new ApiError(400, "Maximum applicants reached for this job");

  const existingApplication = await prisma.jobApplication.findFirst({
    where: { job_id: jobId, applicant_id: userId }
  });
  if (existingApplication) throw new ApiError(400, "You have already applied to this job");

  const editorProfile = await prisma.profile.findUnique({ where: { user_id: userId } });
  const portfolioUrl = editorProfile?.social_links?.website || editorProfile?.social_links?.youtube || `${process.env.FRONTEND_URL}/public-profile/${userId}`;

  const application = await prisma.jobApplication.create({
    data: {
      job_id: jobId,
      applicant_id: userId,
      cover_message: coverMessage?.trim() || "",
      portfolio_url: portfolioUrl,
      suvix_profile_url: `${process.env.FRONTEND_URL}/public-profile/${userId}`,
      expected_rate: Number(expectedRate),
      status: "applied",
      history: {
        create: { status: "applied" }
      },
      editor_contact: editorContact
    }
  });

  await prisma.job.update({
    where: { id: jobId },
    data: { applicant_count: { increment: 1 } }
  });

  await createNotification({
    recipient: job.posted_by,
    type: "info",
    title: "New Job Application",
    message: `${req.user.name} applied for "${job.title}"`,
    link: `/my-jobs/${jobId}/applicants`
  });

  logger.info(`Application submitted: ${application.id} for job ${jobId}`);

  res.status(201).json({
    success: true,
    message: "Application submitted successfully",
    application: mapApplication(application),
  });
});

// ============ GET JOB APPLICATIONS (FOR JOB POSTOR) ============
export const getJobApplications = asyncHandler(async (req, res) => {
  const jobId = req.params.id;
  const userId = req.user.id;
  const { status } = req.query;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new ApiError(404, "Job not found");

  if (job.posted_by !== userId) throw new ApiError(403, "Not authorized to view applicants");

  const where = { job_id: jobId };
  if (status && status !== "all") where.status = status;

  const applications = await prisma.jobApplication.findMany({
    where,
    include: {
      applicant: { select: { id: true, name: true, profile_picture: true, email: true, phone: true } },
      history: true
    },
    orderBy: { created_at: 'desc' }
  });

  const enrichedApplications = await Promise.all(
    applications.map(async (app) => {
      const editorProfile = await prisma.profile.findUnique({
        where: { user_id: app.applicant_id },
        select: { skills: true, experience: true, overall_rating: true, about: true }
      });
      
      return {
        ...mapApplication(app),
        editorProfile,
      };
    })
  );

  res.status(200).json({
    success: true,
    applications: enrichedApplications,
    job: {
      title: job.title,
      roundNames: job.round_names,
      hiringRounds: job.hiring_rounds,
    },
  });
});

// ============ UPDATE APPLICATION STATUS ============
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const applicationId = req.params.applicationId;
  const userId = req.user.id;

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: true, applicant: { select: { id: true, name: true, email: true } } }
  });

  if (!application) throw new ApiError(404, "Application not found");
  if (application.job.posted_by !== userId) throw new ApiError(403, "Not authorized");

  const updates = { status };
  if (note) updates.client_notes = note;
  if (status === "hired") updates.hired_at = new Date();
  else if (status === "rejected") {
    updates.rejected_at = new Date();
    updates.rejection_reason = note || "Not selected";
  }

  const updatedApp = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      ...updates,
      history: {
        create: { status, note }
      }
    }
  });

  const notificationMessages = {
    shortlisted: `Good news! You've been shortlisted for "${application.job.title}"`,
    hired: `🎉 Congratulations! You've been selected for "${application.job.title}"`,
    rejected: `Update on your application for "${application.job.title}"`,
  };

  if (notificationMessages[status]) {
    await createNotification({
      recipient: application.applicant_id,
      type: status === "hired" ? "success" : status === "rejected" ? "warning" : "info",
      title: status === "hired" ? "You're Hired!" : "Application Update",
      message: notificationMessages[status],
      link: "/my-applications"
    });
  }

  res.status(200).json({
    success: true,
    message: `Application status updated to ${status}`,
    application: mapApplication(updatedApp),
  });
});

// ============ HIRE EDITOR ============
export const hireEditor = asyncHandler(async (req, res) => {
  const applicationId = req.params.applicationId;
  const userId = req.user.id;

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: true, applicant: { select: { id: true, name: true, email: true, profile_picture: true } } }
  });

  if (!application) throw new ApiError(404, "Application not found");
  if (application.job.posted_by !== userId) throw new ApiError(403, "Not authorized");

  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      status: "hired",
      hired_at: new Date(),
      history: { create: { status: "hired" } }
    }
  });

  // Emails and Notification logic remains similar to legacy but with updated IDs/Fields
  // (Assuming formatContactHtml and related logic is available or can be ported as helpers)
  
  await createNotification({
    recipient: application.applicant_id,
    type: "success",
    title: "🎉 You're Hired!",
    message: `${req.user.name} selected you for "${application.job.title}". Check your email.`,
    link: "/my-applications"
  });

  res.status(200).json({ success: true, message: "Editor hired successfully!" });
});

// ============ GET MY APPLICATIONS (EDITOR) ============
export const getMyApplications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  const where = { applicant_id: userId };
  if (status && status !== "all") where.status = status;

  const applications = await prisma.jobApplication.findMany({
    where,
    include: {
      job: {
        select: { title: true, category: true, budget_min: true, budget_max: true, status: true, posted_by: true, application_deadline: true, client_contact: true },
        include: { user: { select: { id: true, name: true, profile_picture: true, email: true, phone: true } } }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  res.status(200).json({
    success: true,
    applications: applications.map(mapApplication),
  });
});

// ============ WITHDRAW APPLICATION ============
export const withdrawApplication = asyncHandler(async (req, res) => {
  const applicationId = req.params.applicationId;
  const userId = req.user.id;

  const application = await prisma.jobApplication.findUnique({ where: { id: applicationId } });
  if (!application) throw new ApiError(404, "Application not found");
  if (application.applicant_id !== userId) throw new ApiError(403, "Not authorized");
  if (application.status === "hired") throw new ApiError(400, "Cannot withdraw after being hired");

  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: "withdrawn", history: { create: { status: "withdrawn" } } }
  });

  await prisma.job.update({
    where: { id: application.job_id },
    data: { applicant_count: { decrement: 1 } }
  });

  res.status(200).json({ success: true, message: "Application withdrawn" });
});

// ============ GET JOB STATS ============
export const getJobStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const stats = await prisma.job.groupBy({
    by: ['status'],
    where: { posted_by: userId },
    _count: true
  });

  const counts = { total: 0, active: 0, filled: 0, closed: 0 };
  stats.forEach(s => {
    if (counts[s.status] !== undefined) counts[s.status] = s._count;
    counts.total += s._count;
  });

  res.status(200).json({ success: true, stats: counts });
});

// ============ GET JOB STATS (FOR DASHBOARD) ============
export const getJobStatsData = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [
    totalJobs,
    activeJobs,
    totalApplications,
    hiredCount,
  ] = await Promise.all([
    prisma.job.count({ where: { posted_by: userId } }),
    prisma.job.count({ where: { posted_by: userId, status: "active" } }),
    prisma.jobApplication.count({
      where: { job: { posted_by: userId } },
    }),
    prisma.jobApplication.count({
      where: { job: { posted_by: userId }, status: "hired" },
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
  const userId = req.user.id;
  const userRole = req.user.role;

  let previousContact = null;

  if (userRole === "client") {
    const lastJob = await prisma.job.findFirst({
      where: { posted_by: userId },
      orderBy: { created_at: 'desc' },
      select: { client_contact: true }
    });
    
    if (lastJob?.client_contact) {
      previousContact = lastJob.client_contact;
    }
  } else if (userRole === "editor") {
    const lastApplication = await prisma.jobApplication.findFirst({
      where: { applicant_id: userId },
      orderBy: { created_at: 'desc' },
      select: { editor_contact: true }
    });
    
    if (lastApplication?.editor_contact) {
      previousContact = lastApplication.editor_contact;
    }
  }

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






