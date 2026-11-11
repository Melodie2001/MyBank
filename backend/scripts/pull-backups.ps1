param(
    [string]$Destination = "$env:USERPROFILE\Documents\NexoFinance-Backups",
    [string]$IdentityFile = "$env:USERPROFILE\.ssh\nexo_backup"
)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
$temporaryArchive = Join-Path $Destination ([guid]::NewGuid().ToString() + '.tar')
$errorLog = Join-Path $Destination 'last-transfer-error.log'
try {
    $arguments = '-T -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=30 -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -i "{0}" ubuntu@51.222.36.71' -f $IdentityFile
    $process = Start-Process -FilePath 'ssh.exe' -ArgumentList $arguments -NoNewWindow -Wait -PassThru -RedirectStandardOutput $temporaryArchive -RedirectStandardError $errorLog
    if ($process.ExitCode -ne 0) { throw "SSH failed. See $errorLog" }
    $entries = @(& tar.exe -tf $temporaryArchive)
    if ($LASTEXITCODE -ne 0 -or $entries.Count -ne 2) { throw 'Invalid backup archive' }
    if ($entries[0] -notmatch '^mysql_([0-9]{8}_[0-9]{6})\.sql\.gz$') { throw 'Unexpected MySQL filename' }
    $stamp = $Matches[1]
    if ($entries[1] -ne "mongo_$stamp.archive.gz") { throw 'Mismatched backup pair' }
    & tar.exe -xf $temporaryArchive -C $Destination
    if ($LASTEXITCODE -ne 0) { throw 'Backup extraction failed' }
    # Keep all local copies until a separate retention policy is chosen.
    "$(Get-Date -Format o) Downloaded backup $stamp" | Set-Content -LiteralPath (Join-Path $Destination 'last-success.txt')
    Write-Output "Backup downloaded: $stamp"
}
finally {
    if (Test-Path -LiteralPath $temporaryArchive) { Remove-Item -LiteralPath $temporaryArchive }
}
