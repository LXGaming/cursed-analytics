Clear-Host;

Write-Host "Linting..." -ForegroundColor Cyan;
& npm run lint
if ($LASTEXITCODE -ne 0) {
  Write-Host "";
  Write-Host "Lint Failed" -ForegroundColor Red;
  pause;
  return;
}

Write-Host "Building..." -ForegroundColor Cyan;
& npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "";
  Write-Host "Build Failed" -ForegroundColor Red;
  pause;
  return;
}

Write-Host "";
pause;