import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { phone: "9999999999" },
    update: {},
    create: {
      phone: "9999999999",
      name: "Admin",
      role: "ADMIN",
      city: "Hyderabad",
    },
  });
  console.log("Admin created:", admin.phone);

  // Create categories
  const categories = [
    "Assembly",
    "Machine Operation",
    "Packaging",
    "Warehouse",
    "Quality Check",
    "Production",
    "Maintenance",
    "Fabrication",
    "CNC Operation",
    "Loading/Unloading",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, slug: name.toLowerCase().replace(/\s+/g, "-") },
    });
  }
  console.log("Categories created");

  // Create cities
  const cities = [
    "Jeedimetla", "Patancheru", "Bolaram", "Bahadurpally",
    "Shamshabad", "Gachibowli", "Kompally", "Cherlapally",
    "Nacharam", "Sanathnagar", "Balanagar", "Kukatpally",
    "Hyderabad",
  ];

  for (const name of cities) {
    await prisma.city.upsert({
      where: { name },
      update: {},
      create: { name, slug: name.toLowerCase().replace(/\s+/g, "-") },
    });
  }
  console.log("Cities created");

  // Create plans
  const plans = [
    { name: "Starter", price: 0, durationDays: 7, jobPostLimit: 1, isFeatured: false },
    { name: "Growth", price: 999, durationDays: 30, jobPostLimit: 10, isFeatured: false },
    { name: "Featured Post", price: 299, durationDays: 7, jobPostLimit: 1, isFeatured: true },
  ];

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (existing) {
      await prisma.plan.update({ where: { id: existing.id }, data: plan });
    } else {
      await prisma.plan.create({ data: plan });
    }
  }
  console.log("Plans created");

  // Create sample workers
  const workers = [
    { phone: "9000000001", name: "Rajesh Kumar", trade: "Assembly Line Worker", experience: 3, salary: 12000, city: "Jeedimetla" },
    { phone: "9000000002", name: "Suresh Reddy", trade: "Machine Operator", experience: 5, salary: 15000, city: "Patancheru" },
    { phone: "9000000003", name: "Amit Singh", trade: "Packaging Worker", experience: 2, salary: 10000, city: "Bolaram" },
    { phone: "9000000004", name: "Venkatesh Rao", trade: "Warehouse Helper", experience: 4, salary: 11000, city: "Bahadurpally" },
    { phone: "9000000005", name: "Ravi Teja", trade: "Quality Checker", experience: 6, salary: 18000, city: "Shamshabad" },
    { phone: "9000000006", name: "Mohan Das", trade: "Fabrication Worker", experience: 8, salary: 20000, city: "Cherlapally" },
    { phone: "9000000007", name: "Kishore Babu", trade: "CNC Operator", experience: 5, salary: 16000, city: "Nacharam" },
    { phone: "9000000008", name: "Prakash Jha", trade: "Maintenance Worker", experience: 7, salary: 14000, city: "Sanathnagar" },
    { phone: "9000000009", name: "Dinesh Yadav", trade: "Assembly Line Worker", experience: 1, salary: 9000, city: "Kompally" },
    { phone: "9000000010", name: "Gopal Reddy", trade: "Loading/Unloading Helper", experience: 3, salary: 10000, city: "Balanagar" },
  ];

  for (const w of workers) {
    const user = await prisma.user.upsert({
      where: { phone: w.phone },
      update: { name: w.name, city: w.city },
      create: {
        phone: w.phone,
        name: w.name,
        role: "WORKER",
        city: w.city,
      },
    });

    await prisma.workerProfile.upsert({
      where: { userId: user.id },
      update: {
        trade: w.trade,
        experienceYears: w.experience,
        expectedSalary: w.salary,
        languages: ["Telugu", "Hindi"],
      },
      create: {
        userId: user.id,
        trade: w.trade,
        experienceYears: w.experience,
        expectedSalary: w.salary,
        languages: ["Telugu", "Hindi"],
        isVerified: Math.random() > 0.5,
      },
    });
  }
  console.log("Sample workers created");

  // Create sample employers
  const employers = [
    { phone: "9000000101", name: "Anil Kumar", company: "ABC Fans Pvt Ltd", industry: "Fan Manufacturing", address: "Jeedimetla Industrial Area" },
    { phone: "9000000102", name: "Vijay Reddy", company: "Precision Components", industry: "Automobile Parts", address: "Patancheru" },
    { phone: "9000000103", name: "Sunil Gupta", company: "PackWell Industries", industry: "Packaging", address: "Bolaram" },
    { phone: "9000000104", name: "Rameshwar Rao", company: "TechAssemble Ltd", industry: "Electronics Assembly", address: "Cherlapally" },
  ];

  const employerUserIds: string[] = [];

  for (const e of employers) {
    const user = await prisma.user.upsert({
      where: { phone: e.phone },
      update: { name: e.name },
      create: {
        phone: e.phone,
        name: e.name,
        role: "EMPLOYER",
        city: "Hyderabad",
      },
    });

    await prisma.employerProfile.upsert({
      where: { userId: user.id },
      update: {
        companyName: e.company,
        industry: e.industry,
        address: e.address,
        isVerified: true,
        verifiedAt: new Date(),
      },
      create: {
        userId: user.id,
        companyName: e.company,
        industry: e.industry,
        address: e.address,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    employerUserIds.push(user.id);
  }
  console.log("Sample employers created");

  // Create sample jobs
  const jobs = [
    { employerIdx: 0, title: "Assembly Line Worker", category: "Assembly", location: "Jeedimetla", salaryMin: 10000, salaryMax: 14000, vacancies: 10, shift: "DAY", type: "FULL_TIME" },
    { employerIdx: 0, title: "Paint Shop Helper", category: "Production", location: "Jeedimetla", salaryMin: 9000, salaryMax: 12000, vacancies: 5, shift: "GENERAL", type: "FULL_TIME" },
    { employerIdx: 0, title: "Night Shift Machine Operator", category: "Machine Operation", location: "Jeedimetla", salaryMin: 12000, salaryMax: 16000, vacancies: 8, shift: "NIGHT", type: "FULL_TIME" },
    { employerIdx: 1, title: "CNC Operator", category: "CNC Operation", location: "Patancheru", salaryMin: 15000, salaryMax: 20000, vacancies: 3, shift: "ROTATIONAL", type: "FULL_TIME" },
    { employerIdx: 1, title: "Quality Inspector", category: "Quality Check", location: "Patancheru", salaryMin: 14000, salaryMax: 18000, vacancies: 2, shift: "DAY", type: "FULL_TIME" },
    { employerIdx: 1, title: "Fabrication Worker", category: "Fabrication", location: "Patancheru", salaryMin: 13000, salaryMax: 17000, vacancies: 6, shift: "GENERAL", type: "FULL_TIME" },
    { employerIdx: 2, title: "Packaging Worker", category: "Packaging", location: "Bolaram", salaryMin: 9000, salaryMax: 11000, vacancies: 15, shift: "DAY", type: "FULL_TIME" },
    { employerIdx: 2, title: "Warehouse Helper", category: "Warehouse", location: "Bolaram", salaryMin: 10000, salaryMax: 12000, vacancies: 8, shift: "GENERAL", type: "FULL_TIME" },
    { employerIdx: 2, title: "Loading Supervisor", category: "Loading/Unloading", location: "Bolaram", salaryMin: 12000, salaryMax: 15000, vacancies: 2, shift: "DAY", type: "FULL_TIME" },
    { employerIdx: 3, title: "Electronics Assembler", category: "Assembly", location: "Cherlapally", salaryMin: 11000, salaryMax: 14000, vacancies: 12, shift: "DAY", type: "FULL_TIME" },
    { employerIdx: 3, title: "Maintenance Electrician", category: "Maintenance", location: "Cherlapally", salaryMin: 16000, salaryMax: 20000, vacancies: 2, shift: "ROTATIONAL", type: "FULL_TIME" },
    { employerIdx: 3, title: "Temporary Production Helper", category: "Production", location: "Cherlapally", salaryMin: 8000, salaryMax: 10000, vacancies: 20, shift: "GENERAL", type: "CONTRACT" },
  ];

  for (const j of jobs) {
    const employerId = employerUserIds[j.employerIdx];
    await prisma.job.create({
      data: {
        employerId,
        title: j.title,
        description: `We are looking for experienced ${j.title.toLowerCase()} to join our team. Immediate joining. Food and accommodation can be arranged. ${j.vacancies} positions available.`,
        category: j.category,
        location: j.location,
        city: "Hyderabad",
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        vacancies: j.vacancies,
        shiftType: j.shift as any,
        jobType: j.type as any,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log("Sample jobs created");

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
