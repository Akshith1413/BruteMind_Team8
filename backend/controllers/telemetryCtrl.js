/**
 * Telemetry and Simulation Controller
 * Handles generation of live mock telemetry streams and Monte Carlo projections.
 */

/**
 * Generates next tick of biometric/business telemetry with physiological waveforms
 * @param {Object} currentTelemetry Current telemetry state
 * @returns {Object} Updated telemetry state
 */
export function generateTelemetryTick(currentTelemetry = {}) {
  const baseHr = currentTelemetry.heartRate || 72;
  const baseSync = currentTelemetry.neuralSync || 98.4;
  const baseGenomic = currentTelemetry.genomicDepth || 4.2;

  // Simulate physiological/operational fluctuations
  const hrDelta = (Math.random() - 0.5) * 4; // Max change of 2 bpm
  const newHr = Math.min(Math.max(baseHr + hrDelta, 60), 120); // Keep between 60 and 120 bpm

  const syncDelta = (Math.random() - 0.5) * 1.5;
  const newSync = Math.min(Math.max(baseSync + syncDelta, 85), 100);

  // Genomic depth slowly accumulates as agents parse documents
  const newGenomic = parseFloat((baseGenomic + Math.random() * 0.005).toFixed(3));

  // Calculate generic health index (nominally > 80%)
  const systemHealth = parseFloat((newSync * 0.8 + (100 - Math.abs(newHr - 75)) * 0.2).toFixed(1));

  // Generate high-fidelity 50-point ECG waveform representation for 1 second duration
  const heartWave = generateECGWaveform(newHr, 50);

  return {
    heartRate: Math.round(newHr),
    neuralSync: parseFloat(newSync.toFixed(1)),
    genomicDepth: newGenomic,
    systemHealth,
    heartWave,
    timestamp: new Date()
  };
}

/**
 * Mathematical model for continuous physiological ECG (QRS complex) waves
 */
function generateECGWaveform(bpm, samples = 50) {
  const wave = [];
  const beatDuration = 60 / bpm; // Time in seconds for one full heart cycle
  const timeStep = 1 / samples;  // Duration of one sample

  // Keep a running time phase mapped across 0 to 1
  for (let i = 0; i < samples; i++) {
    const time = i * timeStep;
    const phase = (time % beatDuration) / beatDuration; // Normalized phase of current heartbeat (0 to 1)

    let value = 0;
    
    // P-wave (Atrial depolarization: small positive bulge)
    if (phase >= 0.05 && phase < 0.15) {
      value += 0.12 * Math.sin((phase - 0.05) * Math.PI / 0.10);
    }
    // Q-wave (Septal depolarization: brief dip)
    else if (phase >= 0.16 && phase < 0.19) {
      value -= 0.08 * Math.sin((phase - 0.16) * Math.PI / 0.03);
    }
    // R-spike (Ventricular depolarization: main sharp QRS spike)
    else if (phase >= 0.19 && phase < 0.23) {
      value += 1.0 * Math.sin((phase - 0.19) * Math.PI / 0.04);
    }
    // S-wave (Basal depolarization: quick final dip)
    else if (phase >= 0.23 && phase < 0.27) {
      value -= 0.18 * Math.sin((phase - 0.23) * Math.PI / 0.04);
    }
    // T-wave (Ventricular repolarization: medium positive bulge)
    else if (phase >= 0.37 && phase < 0.52) {
      value += 0.22 * Math.sin((phase - 0.37) * Math.PI / 0.15);
    }
    
    // Add baseline resting potential & minor somatic tremor noise
    value += -0.05 + (Math.random() - 0.5) * 0.02;
    wave.push(parseFloat(value.toFixed(3)));
  }

  return wave;
}

/**
 * Runs a Monte Carlo simulation based on client-defined levers
 * @param {Object} levers Input parameters for simulation { baseValue, iterations, steps, growthRate, riskFactor }
 * @returns {Object} Object containing projection pathways (optimistic, baseline, conservative) and metadata
 */
export function runMonteCarloSimulation(levers = {}) {
  const baseValue = parseFloat(levers.baseValue) || 100;
  const iterations = parseInt(levers.iterations) || 1000;
  const steps = parseInt(levers.steps) || 12; // E.g., 12 months
  const growthRate = parseFloat(levers.growthRate) || 0.05; // 5% base growth per step
  const riskFactor = parseFloat(levers.riskFactor) || 0.1; // 10% volatility

  const allPaths = [];

  for (let i = 0; i < iterations; i++) {
    const path = [baseValue];
    let currentValue = baseValue;

    for (let t = 1; t <= steps; t++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.random() || 0.0001;
      const u2 = Math.random() || 0.0001;
      const randNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      // Geometric Brownian Motion formula
      const drift = growthRate - 0.5 * Math.pow(riskFactor, 2);
      const randomShock = riskFactor * randNormal;
      currentValue = currentValue * Math.exp(drift + randomShock);
      
      path.push(parseFloat(currentValue.toFixed(2)));
    }
    allPaths.push(path);
  }

  // Aggregate outcomes at each step to get percentiles
  const baseline = [];
  const optimistic = [];
  const conservative = [];

  for (let t = 0; t <= steps; t++) {
    const stepValues = allPaths.map(p => p[t]).sort((a, b) => a - b);
    
    // Percentiles: 10% (conservative), 50% (baseline), 90% (optimistic)
    const p10Idx = Math.floor(iterations * 0.1);
    const p50Idx = Math.floor(iterations * 0.5);
    const p90Idx = Math.floor(iterations * 0.9);

    conservative.push(stepValues[p10Idx]);
    baseline.push(stepValues[p50Idx]);
    optimistic.push(stepValues[p90Idx]);
  }

  return {
    success: true,
    metadata: {
      baseValue,
      iterations,
      steps,
      growthRate,
      riskFactor,
      simulatedAt: new Date()
    },
    projections: {
      conservative,
      baseline,
      optimistic,
      timeline: Array.from({ length: steps + 1 }, (_, i) => `Month ${i}`)
    }
  };
}

/**
 * REST wrapper for Monte Carlo Stress Test simulation
 * POST /api/business/stress-test
 */
export function stressTestREST(req, res) {
  try {
    const levers = req.body;
    console.log('[Telemetry Controller] Running Monte Carlo REST simulation request...');
    const report = runMonteCarloSimulation(levers);
    return res.status(200).json({
      message: 'Monte Carlo Stress Test simulation compiled successfully.',
      report
    });
  } catch (error) {
    console.error('Error compiling Monte Carlo stress test:', error);
    return res.status(500).json({ error: 'Internal Server Error during Monte Carlo compilation.' });
  }
}

// Refactor: scale default volatility projections parameters

// Refactor: QRS wave samples check

// Refactor: timeline projection arrays

// Refactor: Box-Muller normal random generator optimization
