# DevFusion 4.0 — API

ASP.NET Core 8 Web API for the Smart Multi-Vendor E-Commerce & Inventory
Management Platform. Uses MySQL (EF Core + Pomelo), JWT auth, and SMTP
email verification via Gmail.

## Folder Structure

```
DevFusionAPI/
├── Controllers/                  # HTTP endpoints (thin — call Services)
│   ├── AuthController.cs         # register / verify-email / login / forgot-reset password
│   └── ProductsController.cs     # example of a role-protected controller (stub)
│
├── Models/
│   ├── Entities/                 # EF Core entities = tables (mirrors devfusion_schema_mysql.sql)
│   │   ├── Role.cs
│   │   ├── User.cs
│   │   ├── EmailVerificationToken.cs
│   │   └── PasswordResetToken.cs
│   └── DTOs/
│       └── AuthDtos.cs           # Request/response contracts + generic ApiResponse<T>
│
├── Data/
│   └── ApplicationDbContext.cs   # DbContext, EF configuration, seed data
│
├── Repositories/                 # Data access layer (interfaces + implementations)
│   ├── IUserRepository.cs
│   └── UserRepository.cs
│
├── Services/                     # Business logic layer
│   ├── IAuthService.cs / AuthService.cs         # register, verify, login, reset flows
│   ├── IEmailService.cs / EmailService.cs       # SMTP sending via MailKit
│   └── ITokenService.cs / TokenService.cs       # JWT issuing
│
├── Middleware/
│   └── ExceptionMiddleware.cs    # global error handler -> consistent JSON error shape
│
├── Helpers/                      # (add validators, mappers, constants here as you grow)
│
├── Properties/
│   └── launchSettings.json
│
├── appsettings.json
├── Program.cs                    # DI wiring, Swagger, JWT, EF Core, middleware pipeline
└── DevFusionAPI.csproj
```

As you build out the rest of the platform (Products, Orders, Cart, Coupons,
Reviews, etc. from the SQL schema), keep the same 4-layer pattern per module:

`Controller -> Service -> Repository -> DbContext (Entity)`

## Setup

1. **Install SDK**: .NET 8 SDK.
2. **Restore packages**:
   ```
   dotnet restore
   ```
3. **Database**: create the `devfusion` MySQL database (or let EF Core do it):
   ```
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```
   (Requires `dotnet tool install --global dotnet-ef` once.)
4. **Run**:
   ```
   dotnet run
   ```
   Swagger UI opens automatically at `http://localhost:5080/` (root path).

## Email Verification Flow

1. `POST /api/auth/register` — creates the user with `IsEmailVerified = false`,
   generates a random URL-safe token, stores it in `email_verification_tokens`
   (24h expiry), and emails a verification link built from
   `AppUrl:FrontendBaseUrl` + `AppUrl:EmailVerificationPath`.
2. Your frontend's verification page reads `?token=...` from the URL and calls
   `GET /api/auth/verify-email?token=...`.
3. On success, `users.is_email_verified` is set to `true`. Sellers are blocked
   from logging in until this happens (see `AuthService.LoginAsync`).
4. `POST /api/auth/resend-verification` re-issues a token if the original
   expired or was lost.

## ⚠️ Before you deploy or commit this anywhere public

The `appsettings.json` in this scaffold has your real SMTP credentials in
plain text (as you pasted them). For anything beyond a local hackathon demo:

- Move `Email:Password` and `Jwt:Secret` out of `appsettings.json` into
  **environment variables** or `dotnet user-secrets` (`dotnet user-secrets set "Email:Password" "..."`).
- Use a **Gmail App Password**, not your real account password — Gmail
  generally rejects SMTP logins with your normal password once 2FA is on,
  and even if it works, leaking it exposes your whole inbox.
- If this repo goes to GitHub, add `appsettings.json` (or at least the
  secrets in it) to `.gitignore` and commit an `appsettings.Example.json`
  with placeholder values instead — the hackathon's deliverables list
  literally asks for a `.env.example` equivalent for this reason.
