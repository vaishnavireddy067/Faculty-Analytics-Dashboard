import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';
import api from '../services/api';

const AccreditationPredictor = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/faculty/accreditation/');
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch accreditation data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-gray-500">Failed to load data.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accreditation Predictor</h1>
          <p className="text-gray-500">Real-time NAAC/NBA scoring based on live faculty metrics.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-center">
            <p className="text-sm text-gray-500 font-medium">Predicted Grade</p>
            <p className="text-3xl font-black text-indigo-600">{data.predicted_grade}</p>
          </div>
          <div className="w-px h-12 bg-gray-200"></div>
          <div className="text-center">
            <p className="text-sm text-gray-500 font-medium">Overall Score</p>
            <p className="text-3xl font-black text-emerald-500">{data.overall_score}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart2 className="text-indigo-500" /> Criteria Breakdown
            </h2>
            <div className="space-y-6">
              {data.criteria.map((criterion) => {
                const percentage = Math.round((criterion.score / criterion.max) * 100);
                let colorClass = "bg-emerald-500";
                if (percentage < 60) colorClass = "bg-red-500";
                else if (percentage < 80) colorClass = "bg-yellow-500";

                return (
                  <div key={criterion.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <h4 className="font-semibold text-gray-800">
                        Criteria {criterion.id}: {criterion.name}
                      </h4>
                      <span className="text-sm font-bold text-gray-600">
                        {criterion.score} / {criterion.max} pts
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${colorClass}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                    {criterion.gap_analysis && (
                      <div className="flex items-start gap-2 mt-2 bg-rose-50 p-3 rounded-lg border border-rose-100">
                        <AlertTriangle size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-rose-700">{criterion.gap_analysis}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-sm text-white">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
              <TrendingUp /> Improvement Path
            </h3>
            <p className="text-indigo-100 text-sm mb-4">Focus on these areas to reach the A++ tier before the next cycle.</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm bg-white/10 p-3 rounded-lg">
                <CheckCircle size={16} className="text-emerald-300 flex-shrink-0 mt-0.5" />
                <span>Increase industry-sponsored projects in ECE department.</span>
              </li>
              <li className="flex items-start gap-2 text-sm bg-white/10 p-3 rounded-lg">
                <CheckCircle size={16} className="text-emerald-300 flex-shrink-0 mt-0.5" />
                <span>Need 5 more high-impact factor SCI publications.</span>
              </li>
              <li className="flex items-start gap-2 text-sm bg-white/10 p-3 rounded-lg">
                <CheckCircle size={16} className="text-emerald-300 flex-shrink-0 mt-0.5" />
                <span>Conduct 2 more FDPs as organizing institute.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="text-amber-500" /> Milestone Tracker
            </h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-500 text-slate-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <CheckCircle size={18} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-gray-900">SSR Prep</div>
                    <time className="text-xs font-medium text-emerald-500">Done</time>
                  </div>
                  <div className="text-sm text-gray-500">Initial data aggregation completed.</div>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-indigo-500 text-slate-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-indigo-100 bg-indigo-50 shadow-sm">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-indigo-900">Gap Fulfillment</div>
                    <time className="text-xs font-medium text-indigo-500">Current</time>
                  </div>
                  <div className="text-sm text-indigo-700">Pushing for remaining patents and grants.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccreditationPredictor;
