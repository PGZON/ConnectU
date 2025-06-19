Write-Host "🚀 ConnectU Setup Script" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js v18 or higher." -ForegroundColor Red
    exit 1
}

# Check Node.js version
$majorVersion = (node --version).Split('.')[0].TrimStart('v')
if ([int]$majorVersion -lt 18) {
    Write-Host "❌ Node.js version 18 or higher is required. Current version: $nodeVersion" -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
npm install

# Setup backend
Write-Host "🔧 Setting up backend..." -ForegroundColor Yellow
Set-Location backend

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
npm install

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "⚠️  Please update the .env file with your configuration:" -ForegroundColor Yellow
    Write-Host "   - MongoDB URI" -ForegroundColor White
    Write-Host "   - JWT Secret" -ForegroundColor White
    Write-Host "   - Cloudinary credentials" -ForegroundColor White
}

Set-Location ..

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update backend/.env with your configuration" -ForegroundColor White
Write-Host "2. Start MongoDB (local or Atlas)" -ForegroundColor White
Write-Host "3. Start backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "4. Start frontend: npm start" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see README.md" -ForegroundColor Cyan 