using System.Text;
using DevFusionAPI.Data;
using DevFusionAPI.Repositories;
using DevFusionAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Clear logging providers to prevent EventLog write permission errors on Windows
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// ------------------------------------------------------------
// 1. Database (MySQL via Pomelo)
// ------------------------------------------------------------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=localhost;Database=devfusion;Uid=root;Pwd=Sowmiya@1827;";
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 30))));

// ------------------------------------------------------------
// 2. Dependency Injection - Repositories & Services
// ------------------------------------------------------------
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// ------------------------------------------------------------
// 3. Controllers
// ------------------------------------------------------------
builder.Services.AddControllers();

// ------------------------------------------------------------
// 4. JWT Authentication
// ------------------------------------------------------------
var jwtSecret = builder.Configuration["Jwt:Secret"]!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CustomerOnly", p => p.RequireRole("customer"));
    options.AddPolicy("SellerOnly", p => p.RequireRole("seller"));
    options.AddPolicy("AdminOnly", p => p.RequireRole("admin"));
    options.AddPolicy("DeliveryPartnerOnly", p => p.RequireRole("delivery_partner"));
});

// ------------------------------------------------------------
// 5. Swagger (with JWT bearer support)
// ------------------------------------------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "DevFusion 4.0 - Multi-Vendor E-Commerce API",
        Version = "v1",
        Description = "API for the Smart Multi-Vendor E-Commerce & Inventory Management Platform"
    });

    var jwtSecurityScheme = new OpenApiSecurityScheme
    {
        Scheme = "bearer",
        BearerFormat = "JWT",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Description = "Enter your JWT token like: Bearer {your token}",
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };

    options.AddSecurityDefinition(jwtSecurityScheme.Reference.Id, jwtSecurityScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { jwtSecurityScheme, Array.Empty<string>() }
    });
});

// ------------------------------------------------------------
// 6. CORS (adjust origins for your frontend in production)
// ------------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultCors", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// ------------------------------------------------------------
// 7. Middleware pipeline
// ------------------------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "DevFusion API v1");
        options.RoutePrefix = string.Empty; // Swagger UI at root: https://localhost:xxxx/
    });
}

app.UseMiddleware<DevFusionAPI.Middleware.ExceptionMiddleware>();

app.UseHttpsRedirection();
app.UseCors("DefaultCors");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();

    // Map of product ID to real working Unsplash image URL
    var imageMappings = new Dictionary<int, string>
    {
        { 1, "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80" }, // Earbuds
        { 2, "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80" }, // Shirt
        { 3, "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&q=80" }, // Frying Pan
        { 4, "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80" }, // Face Serum
        { 5, "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=500&q=80" }, // Dumbbells
        { 6, "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80" }, // Smartphone
        { 7, "https://images.unsplash.com/photo-1496181130204-7552cc145cdb?w=500&q=80" }, // Laptop
        { 8, "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80" }, // Jeans
        { 9, "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&q=80" }, // Floral Dress
        { 10, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80" }  // Running Shoes
    };

    var dbProducts = context.Products.ToList();
    bool hasChanges = false;
    foreach (var product in dbProducts)
    {
        if (imageMappings.TryGetValue(product.Id, out var newImg))
        {
            if (product.Image != newImg)
            {
                product.Image = newImg;
                hasChanges = true;
            }
        }
    }

    if (hasChanges)
    {
        context.SaveChanges();
    }
}

app.Run();
