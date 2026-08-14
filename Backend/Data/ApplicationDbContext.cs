using DevFusionAPI.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace DevFusionAPI.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Seller> Sellers => Set<Seller>();
    public DbSet<Store> Stores => Set<Store>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<Inventory> Inventories => Set<Inventory>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<Setting> Settings => Set<Setting>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Name).HasMaxLength(30).IsRequired();
            entity.HasIndex(r => r.Name).IsUnique();

            entity.HasData(
                new Role { Id = 1, Name = "customer", Description = "Shops on the platform" },
                new Role { Id = 2, Name = "seller", Description = "Manages own store, products and orders" },
                new Role { Id = 3, Name = "admin", Description = "Full platform administration access" },
                new Role { Id = 4, Name = "delivery_partner", Description = "Handles order deliveries" }
            );
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Email).HasMaxLength(255).IsRequired();
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.GoogleId).IsUnique();

            entity.HasOne(u => u.Role)
                  .WithMany(r => r.Users)
                  .HasForeignKey(u => u.RoleId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasData(
                new User
                {
                    Id = "user_1",
                    Name = "John Customer",
                    Email = "customer@test.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("1234"),
                    AuthProvider = "email",
                    RoleId = 1,
                    IsEmailVerified = true,
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new User
                {
                    Id = "user_2",
                    Name = "Alpha Seller",
                    Email = "seller@test.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("1234"),
                    AuthProvider = "email",
                    RoleId = 2,
                    IsEmailVerified = true,
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new User
                {
                    Id = "user_3",
                    Name = "Super Admin",
                    Email = "admin@test.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    AuthProvider = "email",
                    RoleId = 3,
                    IsEmailVerified = true,
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );
        });

        modelBuilder.Entity<Address>(entity =>
        {
            entity.ToTable("addresses");
            entity.HasKey(a => a.Id);
            entity.HasOne(a => a.User)
                  .WithMany(u => u.Addresses)
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("categories");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).HasMaxLength(100).IsRequired();

            entity.HasData(
                new Category { Id = 1, Name = "Electronics", Description = "Devices, gadgets and accessories" },
                new Category { Id = 2, Name = "Fashion", Description = "Apparel, clothing and style" },
                new Category { Id = 3, Name = "Home & Kitchen", Description = "Kitchenware, decor and furniture" },
                new Category { Id = 4, Name = "Books", Description = "Educational and leisure reading" },
                new Category { Id = 5, Name = "Beauty", Description = "Cosmetics and skin care" }
            );
        });

        modelBuilder.Entity<Seller>(entity =>
        {
            entity.ToTable("sellers");
            entity.HasKey(s => s.Id);
            entity.HasOne(s => s.User)
                  .WithOne(u => u.Seller)
                  .HasForeignKey<Seller>(s => s.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasData(
                new Seller
                {
                    Id = "seller_1",
                    UserId = "user_2",
                    BusinessName = "Alpha Retailers",
                    BusinessAddress = "123 Business Rd, Bangalore",
                    IsApproved = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );
        });

        modelBuilder.Entity<Store>(entity =>
        {
            entity.ToTable("stores");
            entity.HasKey(st => st.Id);
            entity.HasOne(st => st.Seller)
                  .WithMany(s => s.Stores)
                  .HasForeignKey(st => st.SellerId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasData(
                new Store
                {
                    Id = 1,
                    SellerId = "seller_1",
                    Name = "Alpha Store",
                    Description = "Premium Electronics and Apparel",
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Title).HasMaxLength(255).IsRequired();
            entity.Property(p => p.Price).HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(p => p.Category).HasMaxLength(100);

            entity.HasOne(p => p.Store)
                  .WithMany(st => st.Products)
                  .HasForeignKey(p => p.StoreId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.CategoryNavigation)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasData(
                new Product
                {
                    Id = 1,
                    Title = "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops",
                    Price = 109.95m,
                    Description = "Your perfect pack for everyday use and walks in the forest. Stash your laptop (up to 15 inches) in the padded sleeve, your daily details in the spacious main compartment.",
                    Category = "Fashion",
                    Image = "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg",
                    StoreId = 1,
                    CategoryId = 2,
                    Brand = "Fjallraven",
                    SKU = "FJ-BACKPACK-01",
                    Stock = 25,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 2,
                    Title = "Mens Casual Premium Slim Fit T-Shirts",
                    Price = 22.3m,
                    Description = "Slim-fitting style, contrast raglan long sleeve, three-button henley placket.",
                    Category = "Fashion",
                    Image = "https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SYY_.jpg",
                    StoreId = 1,
                    CategoryId = 2,
                    Brand = "Henley",
                    SKU = "HN-TSHIRT-02",
                    Stock = 50,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 3,
                    Title = "Mens Cotton Jacket",
                    Price = 55.99m,
                    Description = "great outerwear jackets for Spring/Autumn/Winter, suitable for many occasions.",
                    Category = "Fashion",
                    Image = "https://fakestoreapi.com/img/71li-alvuCL._AC_UX679_.jpg",
                    StoreId = 1,
                    CategoryId = 2,
                    Brand = "Windbreaker",
                    SKU = "WB-JACKET-03",
                    Stock = 15,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 4,
                    Title = "iPhone 15 Pro, 256GB - Natural Titanium",
                    Price = 1199.99m,
                    Description = "Features a strong and light aerospace-grade titanium design. Powered by the A17 Pro chip for next-level mobile gaming and graphics.",
                    Category = "Electronics",
                    Image = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60",
                    StoreId = 1,
                    CategoryId = 1,
                    Brand = "Apple",
                    SKU = "AP-IP15P-256",
                    Stock = 20,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 5,
                    Title = "Sony WH-1000XM5 Wireless Headphones",
                    Price = 349.99m,
                    Description = "Features industry-leading noise cancellation, exceptional sound quality, crystal-clear hands-free calling, and up to 30 hours of battery life.",
                    Category = "Electronics",
                    Image = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
                    StoreId = 1,
                    CategoryId = 1,
                    Brand = "Sony",
                    SKU = "SN-WH1000XM5",
                    Stock = 15,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 6,
                    Title = "Breville Barista Express Espresso Machine",
                    Price = 699.95m,
                    Description = "Prepares delicious specialty coffee in less than a minute. Includes built-in dose control grinder for fresher beans.",
                    Category = "Home & Kitchen",
                    Image = "https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?w=500&auto=format&fit=crop&q=60",
                    StoreId = 1,
                    CategoryId = 3,
                    Brand = "Breville",
                    SKU = "BR-BES870XL",
                    Stock = 8,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 7,
                    Title = "The Pragmatic Programmer: 20th Anniversary Edition",
                    Price = 39.99m,
                    Description = "One of the most significant books on software engineering. A must-read guide for every developer seeking mastery.",
                    Category = "Books",
                    Image = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=60",
                    StoreId = 1,
                    CategoryId = 4,
                    Brand = "Addison-Wesley",
                    SKU = "BK-PRAGMATIC",
                    Stock = 30,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 8,
                    Title = "CeraVe Hydrating Facial Cleanser, 16 Oz",
                    Price = 15.49m,
                    Description = "Formulated with three essential ceramides and hyaluronic acid to cleanse, hydrate, and restore the protective skin barrier.",
                    Category = "Beauty",
                    Image = "https://images.unsplash.com/photo-1608248597481-496100c80836?w=500&auto=format&fit=crop&q=60",
                    StoreId = 1,
                    CategoryId = 5,
                    Brand = "CeraVe",
                    SKU = "CV-CLEAN-16",
                    Stock = 50,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );
        });

        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.ToTable("product_variants");
            entity.HasKey(pv => pv.Id);
            entity.HasOne(pv => pv.Product)
                  .WithMany(p => p.Variants)
                  .HasForeignKey(pv => pv.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Inventory>(entity =>
        {
            entity.ToTable("inventory");
            entity.HasKey(i => i.Id);
            entity.HasOne(i => i.Product)
                  .WithMany()
                  .HasForeignKey(i => i.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(i => i.ProductVariant)
                  .WithMany()
                  .HasForeignKey(i => i.ProductVariantId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.ToTable("cart_items");
            entity.HasKey(c => c.Id);
            entity.HasOne(c => c.User)
                  .WithMany()
                  .HasForeignKey(c => c.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.Product)
                  .WithMany()
                  .HasForeignKey(c => c.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.ProductVariant)
                  .WithMany()
                  .HasForeignKey(c => c.ProductVariantId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WishlistItem>(entity =>
        {
            entity.ToTable("wishlist_items");
            entity.HasKey(w => w.Id);
            entity.HasOne(w => w.User)
                  .WithMany()
                  .HasForeignKey(w => w.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(w => w.Product)
                  .WithMany()
                  .HasForeignKey(w => w.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Coupon>(entity =>
        {
            entity.ToTable("coupons");
            entity.HasKey(cp => cp.Id);
            entity.HasIndex(cp => cp.Code).IsUnique();

            entity.HasOne(cp => cp.Store)
                  .WithMany()
                  .HasForeignKey(cp => cp.StoreId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(cp => cp.Category)
                  .WithMany()
                  .HasForeignKey(cp => cp.CategoryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("orders");
            entity.HasKey(o => o.Id);
            entity.HasOne(o => o.User)
                  .WithMany()
                  .HasForeignKey(o => o.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(o => o.ShippingAddress)
                  .WithMany()
                  .HasForeignKey(o => o.ShippingAddressId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(o => o.BillingAddress)
                  .WithMany()
                  .HasForeignKey(o => o.BillingAddressId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(o => o.DeliveryPartner)
                  .WithMany()
                  .HasForeignKey(o => o.DeliveryPartnerId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("order_items");
            entity.HasKey(oi => oi.Id);
            entity.HasOne(oi => oi.Order)
                  .WithMany(o => o.OrderItems)
                  .HasForeignKey(oi => oi.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(oi => oi.Product)
                  .WithMany()
                  .HasForeignKey(oi => oi.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(oi => oi.ProductVariant)
                  .WithMany()
                  .HasForeignKey(oi => oi.ProductVariantId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("payments");
            entity.HasKey(p => p.Id);
            entity.HasOne(p => p.Order)
                  .WithMany()
                  .HasForeignKey(p => p.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.ToTable("reviews");
            entity.HasKey(rv => rv.Id);
            entity.HasOne(rv => rv.Product)
                  .WithMany(p => p.Reviews)
                  .HasForeignKey(rv => rv.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(rv => rv.User)
                  .WithMany()
                  .HasForeignKey(rv => rv.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("notifications");
            entity.HasKey(n => n.Id);
            entity.HasOne(n => n.User)
                  .WithMany()
                  .HasForeignKey(n => n.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.ToTable("activity_logs");
            entity.HasKey(al => al.Id);
            entity.HasOne(al => al.User)
                  .WithMany()
                  .HasForeignKey(al => al.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Setting>(entity =>
        {
            entity.ToTable("settings");
            entity.HasKey(s => s.Id);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");
            entity.HasKey(rt => rt.Id);
            entity.HasOne(rt => rt.User)
                  .WithMany(u => u.RefreshTokens)
                  .HasForeignKey(rt => rt.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EmailVerificationToken>(entity =>
        {
            entity.ToTable("email_verification_tokens");
            entity.HasKey(t => t.Id);
            entity.HasIndex(t => t.Token).IsUnique();

            entity.HasOne(t => t.User)
                  .WithMany(u => u.EmailVerificationTokens)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.ToTable("password_reset_tokens");
            entity.HasKey(t => t.Id);

            entity.HasOne(t => t.User)
                  .WithMany(u => u.PasswordResetTokens)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
