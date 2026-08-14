using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace DevFusionAPI.Services;

/// <summary>
/// Sends transactional emails (verification, password reset, notifications) via SMTP.
/// All settings are read from the "Email" section of appsettings.json.
/// </summary>
public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    private readonly string _smtpServer;
    private readonly int _port;
    private readonly string _account;
    private readonly string _password;
    private readonly string _senderEmail;
    private readonly string _senderName;
    private readonly bool _requiresAuthentication;
    private readonly SecureSocketOptions _secureSocketOption;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;

        _smtpServer = _configuration["Email:SmtpServer"] ?? "smtp.gmail.com";
        _port = int.TryParse(_configuration["Email:Port"], out var p) ? p : 587;
        _account = _configuration["Email:Account"] ?? "";
        _password = _configuration["Email:Password"] ?? "";
        _senderEmail = _configuration["Email:SenderEmail"] ?? "sowmiyamurugan517@gmail.com";
        _senderName = _configuration["Email:SenderName"] ?? "DevFusion";
        _requiresAuthentication = bool.TryParse(_configuration["Email:RequiresAuthentication"], out var auth) && auth;
        _secureSocketOption = ParseSecureSocketOption(_configuration["Email:SecureSocketOption"]);
    }

    private static SecureSocketOptions ParseSecureSocketOption(string? value) => value switch
    {
        "SslOnConnect" => SecureSocketOptions.SslOnConnect,
        "StartTls" => SecureSocketOptions.StartTls,
        "StartTlsWhenAvailable" => SecureSocketOptions.StartTlsWhenAvailable,
        "None" => SecureSocketOptions.None,
        _ => SecureSocketOptions.StartTls
    };

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_senderName, _senderEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(_smtpServer, _port, _secureSocketOption);

            if (_requiresAuthentication)
            {
                await client.AuthenticateAsync(_account, _password);
            }

            await client.SendAsync(message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToEmail}", toEmail);
            // Swallow SMTP errors during local development so registration does not fail
        }
        finally
        {
            if (client.IsConnected)
            {
                await client.DisconnectAsync(true);
            }
        }
    }

    public Task SendVerificationEmailAsync(string toEmail, string userName, string verificationLink)
    {
        var subject = "Verify your DevFusion account";
        var html = $@"
            <div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>
                <h2>Welcome to DevFusion, {userName}!</h2>
                <p>Please confirm your email address to activate your account and unlock seller features.</p>
                <p>
                    <a href='{verificationLink}'
                       style='background:#6a1b9a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block'>
                       Verify Email
                    </a>
                </p>
                <p>Or copy this link into your browser:<br/>{verificationLink}</p>
                <p style='color:#888;font-size:12px'>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
            </div>";

        return SendEmailAsync(toEmail, subject, html);
    }

    public Task SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink)
    {
        var subject = "Reset your DevFusion password";
        var html = $@"
            <div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>
                <h2>Password Reset Request</h2>
                <p>Hi {userName}, we received a request to reset your password.</p>
                <p>
                    <a href='{resetLink}'
                       style='background:#6a1b9a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block'>
                       Reset Password
                    </a>
                </p>
                <p style='color:#888;font-size:12px'>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
            </div>";

        return SendEmailAsync(toEmail, subject, html);
    }
}
