import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ─── Categories ─────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Cycling" },
      update: {},
      create: {
        name: "Cycling",
        description: "Bicycles, helmets, and cycling accessories",
      },
    }),
    prisma.category.upsert({
      where: { name: "Camping" },
      update: {},
      create: {
        name: "Camping",
        description: "Tents, sleeping bags, and outdoor camping gear",
      },
    }),
    prisma.category.upsert({
      where: { name: "Fitness" },
      update: {},
      create: {
        name: "Fitness",
        description: "Gym equipment and fitness accessories",
      },
    }),
    prisma.category.upsert({
      where: { name: "Water Sports" },
      update: {},
      create: {
        name: "Water Sports",
        description: "Kayaks, surfboards, and water sports gear",
      },
    }),
    prisma.category.upsert({
      where: { name: "Winter Sports" },
      update: {},
      create: {
        name: "Winter Sports",
        description: "Skis, snowboards, and winter gear",
      },
    }),
    prisma.category.upsert({
      where: { name: "Team Sports" },
      update: {},
      create: {
        name: "Team Sports",
        description: "Football, basketball, cricket equipment",
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // ─── Admin User ─────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@1234", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@gearup.com" },
    update: {},
    create: {
      name: "GearUp Admin",
      email: "admin@gearup.com",
      password: adminPassword,
      role: "ADMIN",
      phone: "+8801700000001",
      address: "Dhaka, Bangladesh",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // ─── Provider Users ──────────────────────────────────────────────────────────
  const providerPassword = await bcrypt.hash("Provider@1234", 10);
  const provider1 = await prisma.user.upsert({
    where: { email: "provider1@gearup.com" },
    update: {},
    create: {
      name: "Dhaka Sports Hub",
      email: "provider1@gearup.com",
      password: providerPassword,
      role: "PROVIDER",
      phone: "+8801700000002",
      address: "Gulshan, Dhaka",
    },
  });

  const provider2 = await prisma.user.upsert({
    where: { email: "provider2@gearup.com" },
    update: {},
    create: {
      name: "Outdoor Adventures BD",
      email: "provider2@gearup.com",
      password: providerPassword,
      role: "PROVIDER",
      phone: "+8801700000003",
      address: "Banani, Dhaka",
    },
  });
  console.log("✅ Provider users created");

  // ─── Customer User ───────────────────────────────────────────────────────────
  const customerPassword = await bcrypt.hash("Customer@1234", 10);
  const customer = await prisma.user.upsert({
    where: { email: "customer@gearup.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "customer@gearup.com",
      password: customerPassword,
      role: "CUSTOMER",
      phone: "+8801700000004",
      address: "Mirpur, Dhaka",
    },
  });
  console.log("✅ Customer user created:", customer.email);

  // ─── Gear Items ──────────────────────────────────────────────────────────────
  const gearItems = await Promise.all([
    prisma.gearItem.upsert({
      where: { id: "gear-001" },
      update: {},
      create: {
        id: "gear-001",
        name: "Trek Domane SL 5 Road Bike",
        description:
          "A premium endurance road bike designed for long-distance comfort and performance.",
        brand: "Trek",
        pricePerDay: 1500,
        stock: 3,
        isAvailable: true,
        images: [
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
        ],
        specs: {
          frame: "Carbon fiber",
          gears: "22-speed Shimano 105",
          weight: "8.2 kg",
          size: "M/L",
        },
        categoryId: categories[0].id,
        providerId: provider1.id,
      },
    }),
    prisma.gearItem.upsert({
      where: { id: "gear-002" },
      update: {},
      create: {
        id: "gear-002",
        name: "Coleman Sundome 4-Person Tent",
        description:
          "A durable and easy-to-set-up camping tent perfect for family outdoor adventures.",
        brand: "Coleman",
        pricePerDay: 500,
        stock: 5,
        isAvailable: true,
        images: [
          "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
        ],
        specs: {
          capacity: "4 persons",
          waterproof: "3000mm rating",
          weight: "4.5 kg",
          setupTime: "10 minutes",
        },
        categoryId: categories[1].id,
        providerId: provider1.id,
      },
    }),
    prisma.gearItem.upsert({
      where: { id: "gear-003" },
      update: {},
      create: {
        id: "gear-003",
        name: "Bowflex SelectTech 552 Dumbbells",
        description:
          "Adjustable dumbbells that replace 15 sets of weights, perfect for home gym workouts.",
        brand: "Bowflex",
        pricePerDay: 300,
        stock: 4,
        isAvailable: true,
        images: [
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
        ],
        specs: {
          weightRange: "2.3 - 23.6 kg per dumbbell",
          adjustmentIncrements: "2.5 lbs",
          material: "Steel with rubber coating",
        },
        categoryId: categories[2].id,
        providerId: provider2.id,
      },
    }),
    prisma.gearItem.upsert({
      where: { id: "gear-004" },
      update: {},
      create: {
        id: "gear-004",
        name: "Intex Explorer K2 Kayak",
        description:
          "Inflatable 2-person kayak perfect for rivers and mild whitewater adventures.",
        brand: "Intex",
        pricePerDay: 800,
        stock: 2,
        isAvailable: true,
        images: [
          "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
        ],
        specs: {
          capacity: "2 persons",
          maxWeight: "160 kg",
          length: "3.12 m",
          material: "Vinyl",
        },
        categoryId: categories[3].id,
        providerId: provider2.id,
      },
    }),
    prisma.gearItem.upsert({
      where: { id: "gear-005" },
      update: {},
      create: {
        id: "gear-005",
        name: "Salomon S/Pro 120 Ski Boots",
        description:
          "High-performance ski boots for intermediate to advanced skiers.",
        brand: "Salomon",
        pricePerDay: 600,
        stock: 6,
        isAvailable: true,
        images: [
          "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800",
        ],
        specs: {
          flex: "120",
          shell: "Polyurethane",
          liner: "Custom Fit",
          sizes: "US 7-13",
        },
        categoryId: categories[4].id,
        providerId: provider1.id,
      },
    }),
    prisma.gearItem.upsert({
      where: { id: "gear-006" },
      update: {},
      create: {
        id: "gear-006",
        name: "Kookaburra Cricket Kit",
        description:
          "Complete professional cricket kit including bat, pads, gloves, and helmet.",
        brand: "Kookaburra",
        pricePerDay: 400,
        stock: 8,
        isAvailable: true,
        images: [
          "https://images.unsplash.com/photo-1540747913346-19212a4b423a?w=800",
        ],
        specs: {
          batWeight: "1.2 kg",
          batGrade: "English Willow Grade 1",
          includes: "Bat, pads, gloves, helmet, guard",
        },
        categoryId: categories[5].id,
        providerId: provider2.id,
      },
    }),
  ]);

  console.log(`✅ Created ${gearItems.length} gear items`);
  console.log("\n🎉 Database seed completed successfully!\n");
  console.log("═══════════════════════════════════════");
  console.log("  DEMO CREDENTIALS");
  console.log("═══════════════════════════════════════");
  console.log("  Admin    → admin@gearup.com       / Admin@1234");
  console.log("  Provider → provider1@gearup.com   / Provider@1234");
  console.log("  Customer → customer@gearup.com    / Customer@1234");
  console.log("═══════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
