import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  IndianRupee,
  Flame,
  ArrowRight,
  Info,
  Sparkles,
  Table as TableIcon
} from "lucide-react";
import confetti from "canvas-confetti";

function AnimatedNumber({ value, prefix = "₹" }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    let end = value;
    if (start === end) return;

    let duration = 400; 
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      let progress = Math.min((timestamp - startTime) / duration, 1);
      let easeProgress = 1 - Math.pow(1 - progress, 3);
      let current = Math.round(start + (end - start) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }, [value]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString("en-IN")}
    </span>
  );
}

const formatCurrency = (val) => "₹" + val.toLocaleString("en-IN");

export default function SipCalculator() {
  const [mode, setMode] = useState("sip");
  const [sipType, setSipType] = useState("stepup");

  const [sipInvestment, setSipInvestment] = useState(1000);
  const [lumpsumInvestment, setLumpsumInvestment] = useState(32000);

  const investment = mode === "sip" ? sipInvestment : lumpsumInvestment;
  const setInvestment = mode === "sip" ? setSipInvestment : setLumpsumInvestment;

  const [stepUp, setStepUp] = useState(10);
  const [returnRate, setReturnRate] = useState(12);
  const [timePeriod, setTimePeriod] = useState(5);
  const [inflationRate, setInflationRate] = useState(7);
  const [enableInflation, setEnableInflation] = useState(true);

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  const calculations = useMemo(() => {
    let finalInvested = 0;
    let finalValue = 0;
    const yearlyBreakdown = [];

    if (mode === "lumpsum") {
      finalInvested = investment;
      finalValue = investment * Math.pow(1 + returnRate / 100, timePeriod);
      
      for (let y = 1; y <= timePeriod; y++) {
        let yearTotal = investment * Math.pow(1 + returnRate / 100, y);
        let infAdj = yearTotal / Math.pow(1 + inflationRate / 100, y);
        
        yearlyBreakdown.push({
          year: y,
          investedPerMonth: 0, // Not applicable for lumpsum
          investedThisYear: y === 1 ? investment : 0,
          invested: Math.round(investment),
          returns: Math.round(yearTotal - investment),
          total: Math.round(yearTotal),
          inflationAdjusted: Math.round(infAdj)
        });
      }
    } else {
      const monthlyRate = returnRate / 12 / 100;
      let currentSip = investment;
      let cumulativeInvested = 0;
      let cumulativeValue = 0;

      for (let y = 1; y <= timePeriod; y++) {
        let investedThisYear = 0;
        let currentMonthlySipForYear = 0;

        if (sipType === "normal") {
          currentMonthlySipForYear = investment;
          investedThisYear = investment * 12;
          cumulativeInvested += investedThisYear;
          const months = y * 12;
          cumulativeValue = investment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
        } else {
          currentMonthlySipForYear = currentSip;
          for (let m = 1; m <= 12; m++) {
            investedThisYear += currentSip;
            cumulativeInvested += currentSip;
            cumulativeValue = (cumulativeValue + currentSip) * (1 + monthlyRate);
          }
          // Step-up for the next year
          currentSip = currentSip * (1 + stepUp / 100);
        }

        let infAdj = cumulativeValue / Math.pow(1 + inflationRate / 100, y);

        yearlyBreakdown.push({
          year: y,
          investedPerMonth: Math.round(currentMonthlySipForYear),
          investedThisYear: Math.round(investedThisYear),
          invested: Math.round(cumulativeInvested),
          returns: Math.round(cumulativeValue - cumulativeInvested),
          total: Math.round(cumulativeValue),
          inflationAdjusted: Math.round(infAdj)
        });

        if (y === timePeriod) {
          finalInvested = cumulativeInvested;
          finalValue = cumulativeValue;
        }
      }
    }

    const estReturns = Math.max(0, finalValue - finalInvested);
    const inflationAdjustedValue = finalValue / Math.pow(1 + inflationRate / 100, timePeriod);
    const investedRatio = finalValue > 0 ? (finalInvested / finalValue) * 100 : 50;

    return {
      invested: Math.round(finalInvested),
      returns: Math.round(estReturns),
      total: Math.round(finalValue),
      inflationAdjusted: Math.round(inflationAdjustedValue),
      investedRatio,
      yearlyBreakdown
    };
  }, [mode, sipType, investment, stepUp, returnRate, timePeriod, inflationRate]);

  const strokeDashoffset = 282.7 - (282.7 * calculations.investedRatio) / 100;

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#f59e0b", "#44403c", "#fde047"],
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/40 to-yellow-100/30 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-stone-800 flex flex-col items-center">
      
      {/* Main Calculator Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-100 overflow-hidden mb-16"
      >
        <div className="flex border-b border-stone-100 bg-stone-50/60 p-2 gap-2">
          {["sip", "lumpsum"].map((t) => (
            <button
              key={t}
              onClick={() => handleModeChange(t)}
              className={`relative flex-1 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 capitalize ${
                mode === t ? "text-amber-700" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {mode === t && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 bg-white rounded-2xl shadow-sm border border-stone-200/60"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {t === "sip" ? <TrendingUp size={16} /> : <IndianRupee size={16} />}
                {t === "sip" ? "SIP Calculator" : "Lumpsum"}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mode === "sip" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pt-5 flex gap-2 border-b border-stone-100 pb-3"
            >
              {[
                { id: "stepup", label: "Step-up SIP (Auto Increase)" },
                { id: "normal", label: "Normal SIP (Fixed)" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSipType(sub.id)}
                  className={`text-xs sm:text-sm px-4 py-2 rounded-full font-medium transition-all ${
                    sipType === sub.id
                      ? "bg-amber-50 text-amber-700 border border-amber-300 font-semibold"
                      : "bg-stone-50 text-stone-600 hover:bg-stone-200/70 border border-transparent"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-100">
          
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
            <SliderControl
              label={mode === "sip" ? "Monthly investment" : "Total Investment"}
              value={investment}
              setValue={setInvestment}
              min={mode === "sip" ? 500 : 5000}
              max={mode === "sip" ? 200000 : 5000000}
              step={mode === "sip" ? 500 : 5000}
              unit="₹"
              isPrefix
            />

            <AnimatePresence>
              {mode === "sip" && sipType === "stepup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SliderControl
                    label="Annual step-up"
                    value={stepUp}
                    setValue={setStepUp}
                    min={1}
                    max={50}
                    step={1}
                    unit="%"
                    badge="Increases SIP each year"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <SliderControl
              label="Expected return rate (p.a)"
              value={returnRate}
              setValue={setReturnRate}
              min={1}
              max={30}
              step={0.1}
              unit="%"
            />

            <SliderControl
              label="Time period"
              value={timePeriod}
              setValue={setTimePeriod}
              min={1}
              max={100} 
              step={1}
              unit="Yr"
            />

            <div className="pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="text-orange-500" size={18} />
                  <span className="text-sm font-semibold text-stone-700">
                    Adjust for Inflation
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableInflation}
                    onChange={(e) => setEnableInflation(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <AnimatePresence>
                {enableInflation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100"
                  >
                    <SliderControl
                      label="Expected Inflation Rate"
                      value={inflationRate}
                      setValue={setInflationRate}
                      min={0}
                      max={15}
                      step={0.5}
                      unit="%"
                      isMuted
                    />
                    <p className="text-[11px] text-orange-700 mt-2 flex items-center gap-1">
                      <Info size={12} />
                      Shows you the true purchasing power in today's currency.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 sm:p-8 bg-stone-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-stone-500">
                    <span className="w-3 h-3 rounded-full bg-stone-700"></span>
                    Invested
                  </span>
                  <span className="flex items-center gap-1.5 text-stone-700">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    Est. returns
                  </span>
                </div>
              </div>

              <div className="relative w-44 h-44 mx-auto my-4 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#f59e0b"
                    strokeWidth="10"
                    fill="transparent"
                    className="transition-all duration-500 ease-out"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#44403c"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray="282.7"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                    Total Value
                  </span>
                  <span className="text-sm font-bold text-stone-800 px-2 truncate max-w-[130px]">
                    <AnimatedNumber value={calculations.total} />
                  </span>
                </div>
              </div>

              <div className="space-y-3.5 text-sm mt-6">
                <div className="flex justify-between items-center text-stone-600">
                  <span>Invested amount</span>
                  <span className="font-bold text-stone-800 text-base">
                    <AnimatedNumber value={calculations.invested} />
                  </span>
                </div>

                <div className="flex justify-between items-center text-stone-600">
                  <span>Est. returns</span>
                  <span className="font-bold text-amber-600 text-base">
                    <AnimatedNumber value={calculations.returns} />
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-stone-200">
                  <span className="font-bold text-stone-800">Total Future Value</span>
                  <span className="font-black text-amber-600 text-lg sm:text-xl">
                    <AnimatedNumber value={calculations.total} />
                  </span>
                </div>

                {enableInflation && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 mt-3"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs font-semibold text-orange-800 flex items-center gap-1">
                          <Sparkles size={12} />
                          Real Value (Adjusted)
                        </div>
                        <div className="text-[11px] text-orange-600/80">
                          Purchasing power after {timePeriod} yrs
                        </div>
                      </div>
                      <div className="font-extrabold text-orange-700 text-base sm:text-lg">
                        <AnimatedNumber value={calculations.inflationAdjusted} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={triggerCelebration}
              className="mt-6 w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-colors"
            >
              <span>START INVESTING</span>
              <ArrowRight size={18} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* --- ALL NUMBERS Table --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-100 overflow-hidden"
      >
        <div className="p-6 border-b border-stone-100 flex items-center gap-3 bg-stone-50/60">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-stone-200">
            <TableIcon size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-800">Comprehensive Yearly Breakdown</h2>
            <p className="text-xs text-stone-500 font-medium">Every detail of your wealth accumulation over time</p>
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-4">
          <table className="w-full text-left text-sm text-stone-600 whitespace-nowrap">
            <thead className="text-xs text-stone-500 uppercase bg-stone-50">
              <tr>
                <th className="px-6 py-4 font-bold border-b border-stone-200">Year</th>
                <th className="px-6 py-4 font-bold border-b border-stone-200 text-right text-stone-700">Inv. Per Month</th>
                <th className="px-6 py-4 font-bold border-b border-stone-200 text-right">Invested This Year</th>
                <th className="px-6 py-4 font-bold border-b border-stone-200 text-right">Total Invested</th>
                <th className="px-6 py-4 font-bold border-b border-stone-200 text-right">Est. Returns</th>
                <th className="px-6 py-4 font-bold border-b border-stone-200 text-right text-stone-800">Total Value</th>
                {enableInflation && (
                  <th className="px-6 py-4 font-bold border-b border-stone-200 text-right text-orange-700">Real Value (Inf. Adj)</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {calculations.yearlyBreakdown.map((row) => (
                <tr key={row.year} className="hover:bg-amber-50/30 transition-colors even:bg-stone-50/50">
                  <td className="px-6 py-4 font-bold text-stone-700">Year {row.year}</td>
                  {/* Monthly Investment Column */}
                  <td className="px-6 py-4 text-right font-bold text-stone-600">
                    {mode === "lumpsum" ? "-" : formatCurrency(row.investedPerMonth)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-stone-500">{formatCurrency(row.investedThisYear)}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(row.invested)}</td>
                  <td className="px-6 py-4 text-right font-medium text-amber-600">{formatCurrency(row.returns)}</td>
                  <td className="px-6 py-4 text-right font-bold text-stone-800">{formatCurrency(row.total)}</td>
                  {enableInflation && (
                    <td className="px-6 py-4 text-right font-bold text-orange-600/90">{formatCurrency(row.inflationAdjusted)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function SliderControl({
  label,
  value,
  setValue,
  min,
  max,
  step,
  unit,
  isPrefix = false,
  isMuted = false,
  badge = null,
}) {
  const safeSliderValue = Math.min(value, max);
  const percentage = ((safeSliderValue - min) / (max - min)) * 100;

  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.length > 12) return;
    setLocalValue(val);
    if (val !== "") {
      setValue(Number(val));
    }
  };

  const handleBlur = () => {
    let finalValue = Number(localValue);
    if (localValue === "" || finalValue < min) finalValue = min;
    setLocalValue(finalValue);
    setValue(finalValue);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-center">
        <div>
          <span
            className={`text-sm font-medium ${
              isMuted ? "text-stone-500" : "text-stone-700"
            }`}
          >
            {label}
          </span>
          {badge && (
            <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
              {badge}
            </span>
          )}
        </div>

        <div
          className={`flex items-center px-3 py-1.5 rounded-xl border transition-all ${
            isMuted
              ? "bg-stone-100 border-stone-200 text-stone-700"
              : "bg-amber-50/70 border-amber-200/80 text-amber-700 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200"
          }`}
        >
          {isPrefix && <span className="text-xs font-semibold mr-1">₹</span>}
          <input
            type="number"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-20 sm:w-24 text-right bg-transparent outline-none font-bold text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {!isPrefix && <span className="text-xs font-semibold ml-1">{unit}</span>}
        </div>
      </div>

      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={safeSliderValue}
          onChange={(e) => setValue(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, #f59e0b ${percentage}%, #e7e5e4 ${percentage}%)`,
          }}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-amber-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
        />
      </div>
    </div>
  );
}