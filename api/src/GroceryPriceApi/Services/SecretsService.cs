using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using Newtonsoft.Json;

namespace GroceryPriceApi.Services;

public class SecretsService
{
    private readonly IAmazonSecretsManager _secretsManager;
    private readonly ILogger<SecretsService> _logger;

    public SecretsService(IAmazonSecretsManager secretsManager, ILogger<SecretsService> logger)
    {
        _secretsManager = secretsManager;
        _logger = logger;
    }

    public async Task<string> GetConnectionStringAsync()
    {
        var secretArn = Environment.GetEnvironmentVariable("DB_CONNECTION_SECRET");
        if (string.IsNullOrEmpty(secretArn))
        {
            throw new InvalidOperationException("DB_CONNECTION_SECRET environment variable is not set");
        }

        try
        {
            var request = new GetSecretValueRequest
            {
                SecretId = secretArn
            };

            var response = await _secretsManager.GetSecretValueAsync(request);
            var secretJson = response.SecretString;

            dynamic secret = JsonConvert.DeserializeObject(secretJson)!;

            var connectionString = $"Server={secret.host};Port={secret.port};Database={secret.database};User={secret.username};Password={secret.password};";

            return connectionString;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving database connection secret");
            throw;
        }
    }
}