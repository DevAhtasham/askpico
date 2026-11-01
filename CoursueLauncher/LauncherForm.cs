using System.Diagnostics;
using System.Drawing;
using System.Net.Http;
using System.Text.Json;
using System.Windows.Forms;

namespace CoursueLauncher;

internal sealed class LauncherForm : Form
{
    private const string DevUrl = "http://localhost:5173";
    private static readonly TimeSpan ReadyTimeout = TimeSpan.FromMinutes(5);

    private readonly string _baseDir = AppContext.BaseDirectory;
    private readonly Label _title = new();
    private readonly Label _status = new();
    private readonly ProgressBar _progress = new();
    private Process? _devProcess;

    public LauncherForm()
    {
        Text = "Project Launcher";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(440, 160);
        BackColor = Color.FromArgb(24, 26, 33);
        ForeColor = Color.White;
        Font = new Font("Segoe UI", 10f);

        _title.Text = "Setting up project & installing dependencies...";
        _title.Font = new Font("Segoe UI Semibold", 11f);
        _title.SetBounds(20, 20, 400, 26);

        _status.Text = "Preparing...";
        _status.ForeColor = Color.FromArgb(160, 170, 190);
        _status.SetBounds(20, 56, 400, 22);

        _progress.Style = ProgressBarStyle.Marquee;
        _progress.MarqueeAnimationSpeed = 25;
        _progress.SetBounds(20, 96, 400, 14);

        Controls.AddRange(new Control[] { _title, _status, _progress });
        Shown += async (_, _) => await RunAsync();
    }

    private async Task RunAsync()
    {
        try
        {
            ValidatePackageJson();

            SetStatus("Installing dependencies (npm install)...");
            int installExit = await RunHiddenAsync("npm install");
            if (installExit != 0)
                throw new InvalidOperationException(
                    $"npm install failed (exit code {installExit}). Check that Node.js is installed and run it manually in this folder for details.");

            SetStatus("Starting development server (npm run dev)...");
            _devProcess = StartHidden("npm run dev");

            SetStatus($"Waiting for {DevUrl} ...");
            await WaitForServerAsync();

            Process.Start(new ProcessStartInfo(DevUrl) { UseShellExecute = true });
            Close();
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, ex.Message, "Launcher Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Close();
        }
    }

    private void ValidatePackageJson()
    {
        string path = Path.Combine(_baseDir, "package.json");
        if (!File.Exists(path))
            throw new FileNotFoundException("package.json was not found next to Launcher.exe.", path);

        using var doc = JsonDocument.Parse(File.ReadAllText(path));
        if (!doc.RootElement.TryGetProperty("scripts", out var scripts) || !scripts.TryGetProperty("dev", out _))
            throw new InvalidOperationException("package.json does not define a \"dev\" script.");
    }

    private async Task<int> RunHiddenAsync(string command)
    {
        using var process = StartHidden(command);
        await process.WaitForExitAsync();
        return process.ExitCode;
    }

    private Process StartHidden(string command)
    {
        var info = new ProcessStartInfo("cmd.exe", $"/c {command}")
        {
            WorkingDirectory = _baseDir,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        return Process.Start(info) ?? throw new InvalidOperationException($"Could not start: {command}");
    }

    private async Task WaitForServerAsync()
    {
        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
        DateTime deadline = DateTime.UtcNow + ReadyTimeout;

        while (DateTime.UtcNow < deadline)
        {
            if (_devProcess is { HasExited: true })
                throw new InvalidOperationException("The dev server stopped unexpectedly. Run \"npm run dev\" manually for details.");

            try
            {
                using var _ = await http.GetAsync(DevUrl);
                return;
            }
            catch (HttpRequestException)
            {
            }
            catch (TaskCanceledException)
            {
            }

            await Task.Delay(500);
        }

        throw new TimeoutException($"Timed out waiting for {DevUrl}.");
    }

    private void SetStatus(string text) => _status.Text = text;
}
