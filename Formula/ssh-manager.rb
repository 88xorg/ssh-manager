# Replace 88xorg with your GitHub username and update SHA256 hashes after first release.
# To use: brew tap 88xorg/tap && brew install sshm

class SshManager < Formula
  desc "Interactive CLI tool for managing SSH credentials"
  homepage "https://github.com/88xorg/sshm"
  version "1.0.0"

  on_macos do
    on_arm do
      url "https://github.com/88xorg/sshm/releases/download/v#{version}/sshm-darwin-arm64"
      sha256 "REPLACE_WITH_SHA256"
    end
    on_intel do
      url "https://github.com/88xorg/sshm/releases/download/v#{version}/sshm-darwin-x64"
      sha256 "REPLACE_WITH_SHA256"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/88xorg/sshm/releases/download/v#{version}/sshm-linux-arm64"
      sha256 "REPLACE_WITH_SHA256"
    end
    on_intel do
      url "https://github.com/88xorg/sshm/releases/download/v#{version}/sshm-linux-x64"
      sha256 "REPLACE_WITH_SHA256"
    end
  end

  def install
    binary_name = "sshm-#{OS.kernel_name.downcase}-#{Hardware::CPU.arch == :arm64 ? "arm64" : "x64"}"
    bin.install binary_name => "sshm"
  end

  test do
    assert_match "SSH Manager", shell_output("#{bin}/sshm --help 2>&1", 1)
  end
end
