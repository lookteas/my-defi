# TypeScript Compilation Check Script
Write-Host "Starting TypeScript compilation check..." -ForegroundColor Yellow

# Run TypeScript compilation check
npx tsc --noEmit

if ($LASTEXITCODE -eq 0) {
    Write-Host "TypeScript compilation check passed" -ForegroundColor Green
} else {
    Write-Host "TypeScript compilation check failed" -ForegroundColor Red
}

Write-Host "Check completed!" -ForegroundColor Cyan