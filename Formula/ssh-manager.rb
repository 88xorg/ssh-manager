# Replace GITHUB_USER with your GitHub username and update SHA256 hashes after first release.
# To use: brew tap GITHUB_USER/tap && brew install ssh-manager

class SshManager < Formula
  desc "Interactive CLI tool for managing SSH credentials"
  homepage "https://github.com/GITHUB_USER/ssh-manager"
  version "1.0.0"

  on_macos do
    on_arm do
      url "https://github.com/GITHUB_USER/ssh-manager/releases/download/v#{version}/ssh-manager-darwin-arm64"
      sha256 "REPLACE_WITH_SHA256"
    end
    on_intel do
      url "https://github.com/GITHUB_USER/ssh-manager/releases/download/v#{version}/ssh-manager-darwin-x64"
      sha256 "REPLACE_WITH_SHA256"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/GITHUB_USER/ssh-manager/releases/download/v#{version}/ssh-manager-linux-arm64"
      sha256 "REPLACE_WITH_SHA256"
    end
    on_intel do
      url "https://github.com/GITHUB_USER/ssh-manager/releases/download/v#{version}/ssh-manager-linux-x64"
      sha256 "REPLACE_WITH_SHA256"
    end
  end

  def install
    binary_name = "ssh-manager-#{OS.kernel_name.downcase}-#{Hardware::CPU.arch == :arm64 ? "arm64" : "x64"}"
    bin.install binary_name => "ssh-manager"
  end

  test do
    assert_match "SSH Manager", shell_output("#{bin}/ssh-manager --help 2>&1", 1)
  end
end
