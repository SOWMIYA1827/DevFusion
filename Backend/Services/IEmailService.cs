namespace DevFusionAPI.Services;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string htmlBody);
    Task SendVerificationEmailAsync(string toEmail, string userName, string verificationLink);
    Task SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink);
}
