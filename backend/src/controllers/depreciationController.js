const knex = require('../config/knex');

// Helper to calculate depreciation details for a single asset up to a given year
function calculateAssetDepreciation(asset, targetYear) {
  const cost = Number(asset.acquisition_cost || 0);
  const acqDateStr = asset.acquisition_date;
  
  if (!acqDateStr || cost <= 0) {
    return {
      asset_id: asset.id,
      asset_code: asset.asset_id,
      asset_name: asset.asset_name,
      acquisition_cost: cost,
      useful_life_years: 5,
      accumulated_depreciation: 0,
      book_value: cost,
      monthly_depreciation: 0,
      monthly_details: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, depreciation: 0, book_value: cost }))
    };
  }

  const acqDate = new Date(acqDateStr);
  const acqYear = acqDate.getFullYear();
  const acqMonth = acqDate.getMonth(); // 0-indexed

  // Useful life: default 5 years (60 months)
  const usefulLifeYears = 5;
  const usefulLifeMonths = usefulLifeYears * 12;
  const monthlyRate = 1 / usefulLifeMonths;
  const monthlyDepValue = cost * monthlyRate;

  // Let's build monthly details for the selected targetYear (1 to 12)
  const monthlyDetails = [];
  let accumDep = 0;
  
  // Calculate accumulated depreciation before the targetYear starts
  const startOfTargetYear = new Date(targetYear, 0, 1);
  let monthsPrior = 0;
  
  if (acqDate < startOfTargetYear) {
    const yearsDiff = targetYear - acqYear;
    monthsPrior = (yearsDiff * 12) - acqMonth;
    // Limit to useful life
    monthsPrior = Math.min(Math.max(0, monthsPrior), usefulLifeMonths);
  }

  let priorAccumDep = monthsPrior * monthlyDepValue;
  if (priorAccumDep > cost) priorAccumDep = cost;

  let currentAccum = priorAccumDep;

  for (let m = 0; m < 12; m++) {
    const currentMonthDate = new Date(targetYear, m, 1);
    let depThisMonth = 0;

    if (currentMonthDate >= acqDate) {
      // Calculate total months elapsed since acquisition including this month
      const totalMonthsElapsed = ((targetYear - acqYear) * 12) + (m - acqMonth) + 1;
      
      if (totalMonthsElapsed <= usefulLifeMonths) {
        depThisMonth = monthlyDepValue;
        // Make sure we don't exceed acquisition cost
        if (currentAccum + depThisMonth > cost) {
          depThisMonth = Math.max(0, cost - currentAccum);
        }
      }
    }

    currentAccum += depThisMonth;
    const bookVal = Math.max(1, cost - currentAccum); // minimum book value Rp 1

    monthlyDetails.push({
      month_name: new Date(targetYear, m, 1).toLocaleDateString('id-ID', { month: 'long' }),
      month_index: m + 1,
      depreciation: Number(depThisMonth.toFixed(2)),
      accumulated: Number(currentAccum.toFixed(2)),
      book_value: Number(bookVal.toFixed(2))
    });
  }

  const finalAccum = monthlyDetails[11].accumulated;
  const finalBook = monthlyDetails[11].book_value;

  return {
    asset_id: asset.id,
    asset_code: asset.asset_id,
    asset_name: asset.asset_name,
    register_no: asset.register_no,
    acquisition_date: acqDateStr,
    acquisition_cost: cost,
    useful_life_years: usefulLifeYears,
    formula: asset.depreciation_formula || 'Straight-Line',
    accumulated_depreciation: Number(finalAccum.toFixed(2)),
    book_value: Number(finalBook.toFixed(2)),
    monthly_depreciation: Number(monthlyDepValue.toFixed(2)),
    monthly_details: monthlyDetails
  };
}

// ─────────────────────────────────────────────
// GET /api/depreciations/calculate - Kalkulasi Depresiasi
// ─────────────────────────────────────────────
exports.calculateDepreciation = async (req, res) => {
  try {
    const targetYear = parseInt(req.query.year) || new Date().getFullYear();

    // Query active and depreciable assets
    const assets = await knex('pa_assets')
      .where('is_depreciable', true)
      .whereIn('status', ['Active', 'Disposed'])
      .select('*');

    const results = assets.map(asset => calculateAssetDepreciation(asset, targetYear));

    // Summary totals
    const totals = {
      total_acquisition_cost: 0,
      total_accumulated_depreciation: 0,
      total_book_value: 0
    };

    results.forEach(r => {
      totals.total_acquisition_cost += r.acquisition_cost;
      totals.total_accumulated_depreciation += r.accumulated_depreciation;
      totals.total_book_value += r.book_value;
    });

    res.json({
      year: targetYear,
      totals,
      assets: results
    });
  } catch (error) {
    console.error('[Depreciation] calculateDepreciation error:', error);
    res.status(500).json({ message: 'Gagal mengkalkulasi depresiasi', error: error.message });
  }
};
