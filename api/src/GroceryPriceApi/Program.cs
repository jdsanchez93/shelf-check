using Amazon.SecretsManager;
using Microsoft.EntityFrameworkCore;
using GroceryPriceApi.Data;
using GroceryPriceApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Check if running locally
var useLocalDatabase = builder.Configuration.GetValue<bool>("UseLocalDatabase");

if (useLocalDatabase)
{
    // Local development - use direct connection string
    builder.Services.AddDbContext<GroceryContext>(options =>
    {
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 35));
        options.UseMySql(connectionString, serverVersion, mysqlOptions =>
        {
            mysqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
        });
    });
}
else
{
    // AWS Lambda - use Secrets Manager
    builder.Services.AddDefaultAWSOptions(builder.Configuration.GetAWSOptions());
    builder.Services.AddAWSService<IAmazonSecretsManager>();
    builder.Services.AddSingleton<SecretsService>();

    // Add Entity Framework with MySQL
    builder.Services.AddDbContext<GroceryContext>(async (serviceProvider, options) =>
    {
        var secretsService = serviceProvider.GetRequiredService<SecretsService>();
        var connectionString = await secretsService.GetConnectionStringAsync();

        var serverVersion = new MySqlServerVersion(new Version(8, 0, 35));
        options.UseMySql(connectionString, serverVersion, mysqlOptions =>
        {
            mysqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
        });
    });
}

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Note: Lambda hosting is configured in LambdaEntryPoint.cs for AWS deployment
// For local development, we run as a normal web application

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();

// Run migrations on startup for local development
if (useLocalDatabase || app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        try
        {
            var context = scope.ServiceProvider.GetRequiredService<GroceryContext>();
            await context.Database.MigrateAsync();
        }
        catch (Exception ex)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "An error occurred while migrating the database.");
        }
    }
}

app.Run();