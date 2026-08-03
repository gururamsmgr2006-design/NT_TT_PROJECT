// ============================================================
// utils/seeder.js — Seed MongoDB with Sample Data
//
// FIX BE-3: Added NODE_ENV production guard.
//            Running npm run seed in production will now abort.
//
// Run: npm run seed   (development only)
// ============================================================

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const Job      = require('../models/Job');

// ─── PRODUCTION GUARD ────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  console.error('\n❌ ERROR: Seeder is DISABLED in production environment.');
  console.error('   This command would delete all production data.');
  console.error('   If you really need to seed, temporarily set NODE_ENV=development.\n');
  process.exit(1);
}

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB for seeding...');
};

const sampleUsers = [
  {
    fullName: 'Sarah Mitchell', email: 'recruiter@talenttrack.com',
    password: 'Recruiter@123', role: 'recruiter', companyName: 'TechNova Solutions',
    location: 'San Francisco, CA',
    bio: 'Talent acquisition lead at TechNova, building world-class engineering teams.',
  },
  {
    fullName: 'James Patel', email: 'recruiter2@talenttrack.com',
    password: 'Recruiter@123', role: 'recruiter', companyName: 'FinEdge Capital',
    location: 'New York, NY', bio: 'Hiring top finance and tech talent for FinEdge.',
  },
  {
    fullName: 'Alex Kumar', email: 'jobseeker@talenttrack.com',
    password: 'Jobseeker@123', role: 'jobseeker', location: 'Austin, TX',
    bio: 'Full-stack developer looking for exciting opportunities in product companies.',
  },
  {
    fullName: 'Priya Sharma', email: 'jobseeker2@talenttrack.com',
    password: 'Jobseeker@123', role: 'jobseeker', location: 'Remote',
    bio: 'UI/UX designer passionate about user-centered design.',
  },
];

const getSampleJobs = (r1, r2) => [
  { title:'Senior Full-Stack Engineer', company:'TechNova Solutions', location:'San Francisco, CA', description:'Join our core product team building the next-gen SaaS platform. You will architect and ship features used by 500k+ users daily. We value clean code, collaboration, and continuous learning. You will work closely with product, design, and data teams in a fast-paced agile environment.', requirements:'React, Node.js, PostgreSQL, 4+ years experience\nStrong problem-solving skills', salaryMin:120000, salaryMax:160000, salaryDisplay:'$120k - $160k', category:'tech', jobType:'fulltime', experienceLevel:'senior', postedBy:r1 },
  { title:'Frontend Developer (React)', company:'TechNova Solutions', location:'Remote', description:'We are looking for a passionate Frontend Developer to build beautiful, responsive UI components. You will collaborate with designers to implement pixel-perfect interfaces and optimize for performance and accessibility. Remote-first culture with async communication.', requirements:'React 18+, TypeScript, Tailwind CSS\n2+ years frontend experience', salaryMin:90000, salaryMax:120000, salaryDisplay:'$90k - $120k', category:'tech', jobType:'remote', experienceLevel:'mid', postedBy:r1 },
  { title:'DevOps / Cloud Engineer', company:'TechNova Solutions', location:'San Francisco, CA (Hybrid)', description:'Scale our infrastructure to handle millions of requests. You will manage CI/CD pipelines, Kubernetes clusters, and cloud cost optimization. Work closely with backend engineers to improve deployment reliability and observability.', requirements:'AWS/GCP, Kubernetes, Terraform, Docker\n3+ years DevOps experience', salaryMin:130000, salaryMax:170000, salaryDisplay:'$130k - $170k', category:'tech', jobType:'fulltime', experienceLevel:'senior', postedBy:r1 },
  { title:'UX/UI Designer', company:'TechNova Solutions', location:'Remote', description:'Shape the user experience for a product loved by thousands of teams. You will run design sprints, conduct user research, create wireframes and high-fidelity prototypes, and maintain our design system. You will have direct impact on every screen our users see.', requirements:'Figma, Framer, user research methods\n2+ years product design experience', salaryMin:85000, salaryMax:115000, salaryDisplay:'$85k - $115k', category:'design', jobType:'remote', experienceLevel:'mid', postedBy:r1 },
  { title:'Quantitative Analyst', company:'FinEdge Capital', location:'New York, NY', description:'Develop and backtest algorithmic trading strategies using statistical modeling and machine learning. You will work within a small, high-performing quant team in a hedge fund environment with access to proprietary datasets.', requirements:'Python, R, pandas, numpy\nStrong statistics and linear algebra', salaryMin:180000, salaryMax:250000, salaryDisplay:'$180k - $250k', category:'finance', jobType:'fulltime', experienceLevel:'senior', postedBy:r2 },
  { title:'Financial Analyst', company:'FinEdge Capital', location:'New York, NY', description:'Support investment decisions through financial modeling, valuation analysis, and industry research. You will prepare investment memos, monitor portfolio performance, and collaborate with senior analysts on deal flow.', requirements:'Excel, DCF modeling, Bloomberg\n1-3 years finance experience', salaryMin:80000, salaryMax:110000, salaryDisplay:'$80k - $110k', category:'finance', jobType:'fulltime', experienceLevel:'entry', postedBy:r2 },
  { title:'Marketing Manager', company:'TechNova Solutions', location:'Remote', description:'Lead demand generation and brand marketing for our SaaS platform. Own content strategy, run paid campaigns, manage SEO, and collaborate with sales to hit pipeline targets. You will be the marketing team of one with a budget to build it out.', requirements:'B2B SaaS marketing experience\nHubSpot/Marketo, Google Analytics', salaryMin:95000, salaryMax:125000, salaryDisplay:'$95k - $125k', category:'marketing', jobType:'fulltime', experienceLevel:'mid', postedBy:r1 },
  { title:'Software Engineering Intern', company:'TechNova Solutions', location:'San Francisco, CA', description:'A 3-month summer internship where you will work on real features shipped to production. You will be paired with a senior mentor and have the opportunity to convert to full-time. We believe in learning by doing.', requirements:'CS degree in progress\nBasic knowledge of any programming language', salaryMin:40, salaryMax:60, salaryDisplay:'$40-$60/hour', category:'tech', jobType:'internship', experienceLevel:'entry', postedBy:r1 },
  { title:'Backend Engineer (Python)', company:'FinEdge Capital', location:'New York, NY', description:'Build high-performance backend services processing millions of financial events per day. You will design APIs, optimize database queries, and ensure system reliability at scale.', requirements:'Python, FastAPI or Django\nPostgreSQL, Redis\n3+ years backend development', salaryMin:130000, salaryMax:170000, salaryDisplay:'$130k - $170k', category:'tech', jobType:'fulltime', experienceLevel:'mid', postedBy:r2 },
  { title:'Graphic Designer (Contract)', company:'TechNova Solutions', location:'Remote (Contract)', description:'A 6-month contract role creating marketing collateral, social media graphics, and landing page visuals. You will work with the marketing team to bring campaigns to life with high-quality, on-brand design.', requirements:'Adobe Creative Suite\nMotion graphics experience preferred', salaryMin:50, salaryMax:80, salaryDisplay:'$50-$80/hour', category:'design', jobType:'contract', experienceLevel:'mid', postedBy:r1 },
];

const seed = async () => {
  await connectDB();

  console.log('🗑️  Clearing existing Users and Jobs...');
  await User.deleteMany({});
  await Job.deleteMany({});

  console.log('👤 Creating sample users...');
  const hashedUsers = await Promise.all(
    sampleUsers.map(async (u) => {
      const salt = await bcrypt.genSalt(12);
      return { ...u, password: await bcrypt.hash(u.password, salt) };
    })
  );
  const createdUsers = await User.insertMany(hashedUsers);

  const r1 = createdUsers.find(u => u.email === 'recruiter@talenttrack.com');
  const r2 = createdUsers.find(u => u.email === 'recruiter2@talenttrack.com');

  console.log('💼 Creating sample jobs...');
  await Job.insertMany(getSampleJobs(r1._id, r2._id));

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('─────────────────────────────────────────');
  console.log('RECRUITER 1:  recruiter@talenttrack.com  / Recruiter@123');
  console.log('RECRUITER 2:  recruiter2@talenttrack.com / Recruiter@123');
  console.log('JOBSEEKER 1:  jobseeker@talenttrack.com  / Jobseeker@123');
  console.log('JOBSEEKER 2:  jobseeker2@talenttrack.com / Jobseeker@123');
  console.log('─────────────────────────────────────────\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
