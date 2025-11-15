import { BACKEND_URL } from "../utils/api";
import { useState } from "react";

interface AnalysisResultsProps {
  data: {
    metrics: {
      front_elbow_angle: number;
      back_elbow_angle: number;
      torso_lean: number;
      shoulder_alignment: number;
      front_knee_angle: number;
      back_knee_angle: number;
      hip_rotation: number;
      wrist_angle: number;
      head_position: number;
      center_of_mass: number;
    };
    feedback: Array<{
      category: string;
      score: number;
      message: string;
      severity: 'good' | 'warning' | 'error';
    }>;
    keyframe_path: string;
    shot_type: string;
  };
}

export default function AnalysisResults({ data }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'feedback' | 'keyframe'>('metrics');

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'good': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-2xl border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Cricket Shot Analysis Results</h2>
        <p className="text-gray-600">Comprehensive biomechanical analysis of your {data.shot_type.replace('_', ' ')} shot</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-50 rounded-xl p-1 mb-8">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 px-6 py-3 font-semibold text-sm rounded-lg transition-all duration-200 ${
            activeTab === 'metrics'
              ? 'bg-white text-blue-600 shadow-md'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          📊 Metrics
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex-1 px-6 py-3 font-semibold text-sm rounded-lg transition-all duration-200 ${
            activeTab === 'feedback'
              ? 'bg-white text-blue-600 shadow-md'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          💬 Feedback
        </button>
        <button
          onClick={() => setActiveTab('keyframe')}
          className={`flex-1 px-6 py-3 font-semibold text-sm rounded-lg transition-all duration-200 ${
            activeTab === 'keyframe'
              ? 'bg-white text-blue-600 shadow-md'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          🎯 Keyframe
        </button>
      </div>

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Biomechanical Metrics</h3>
            <p className="text-gray-600">Detailed angle measurements and body positioning analysis</p>
          </div>

          {/* Arm Mechanics */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border border-blue-100">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">💪</span>
              </div>
              <h4 className="text-xl font-bold text-gray-800">Arm Mechanics</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-400">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Front Elbow Angle</span>
                  <span className="text-2xl font-bold text-blue-600">{data.metrics.front_elbow_angle}°</span>
                </div>
                <div className="text-xs text-gray-500">Ideal: 150-170°</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: `${Math.min(100, (data.metrics.front_elbow_angle / 180) * 100)}%`}}></div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-400">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Back Elbow Angle</span>
                  <span className="text-2xl font-bold text-blue-600">{data.metrics.back_elbow_angle}°</span>
                </div>
                <div className="text-xs text-gray-500">Ideal: 70-100°</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: `${Math.min(100, (data.metrics.back_elbow_angle / 120) * 100)}%`}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Torso & Shoulder */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl shadow-lg border border-green-100">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">🏃</span>
              </div>
              <h4 className="text-xl font-bold text-gray-800">Torso & Shoulder</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-400">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Torso Lean</span>
                  <span className="text-2xl font-bold text-green-600">{data.metrics.torso_lean}°</span>
                </div>
                <div className="text-xs text-gray-500">Ideal: 10-25° forward</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: `${Math.min(100, (data.metrics.torso_lean / 30) * 100)}%`}}></div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-400">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Shoulder Alignment</span>
                  <span className="text-2xl font-bold text-green-600">{data.metrics.shoulder_alignment}°</span>
                </div>
                <div className="text-xs text-gray-500">Ideal: 15-30°</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: `${Math.min(100, (data.metrics.shoulder_alignment / 40) * 100)}%`}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Lower Body */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl shadow-lg border border-purple-100">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">🦵</span>
              </div>
              <h4 className="text-xl font-bold text-gray-800">Lower Body</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-400">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Front Knee Angle</span>
                  <span className="text-2xl font-bold text-purple-600">{data.metrics.front_knee_angle}°</span>
                </div>
                <div className="text-xs text-gray-500">Ideal: 80-100°</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: `${Math.min(100, (data.metrics.front_knee_angle / 120) * 100)}%`}}></div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-400">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Back Knee Angle</span>
                  <span className="text-2xl font-bold text-purple-600">{data.metrics.back_knee_angle}°</span>
                </div>
                <div className="text-xs text-gray-500">Ideal: 120-150°</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: `${Math.min(100, (data.metrics.back_knee_angle / 180) * 100)}%`}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl shadow-lg border border-orange-100">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">⚡</span>
              </div>
              <h4 className="text-xl font-bold text-gray-800">Additional Metrics</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-400">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Hip Rotation</span>
                  <span className="text-2xl font-bold text-orange-600">{data.metrics.hip_rotation}°</span>
                </div>
                <div className="text-xs text-gray-500">Ideal: 30-50°</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{width: `${Math.min(100, (data.metrics.hip_rotation / 60) * 100)}%`}}></div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-400">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Wrist Angle</span>
                  <span className="text-2xl font-bold text-orange-600">{data.metrics.wrist_angle}°</span>
                </div>
                <div className="text-xs text-gray-500">Ideal: 150-170°</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{width: `${Math.min(100, (data.metrics.wrist_angle / 180) * 100)}%`}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Performance Feedback</h3>
            <p className="text-gray-600">Detailed analysis and improvement suggestions for your cricket shot</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.feedback.map((item, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${getSeverityColor(item.severity)}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      item.severity === 'good' ? 'bg-green-500' : 
                      item.severity === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <h4 className="text-lg font-bold text-gray-800">{item.category}</h4>
                  </div>
                  {item.score && (
                    <div className="text-right">
                      <span className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                        {item.score}/10
                      </span>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  )}
                </div>
                <p className="text-sm leading-relaxed">{item.message}</p>

                {/* Progress indicator */}
                {item.score && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.score >= 8 ? 'bg-green-500' : 
                          item.score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{width: `${item.score * 10}%`}}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keyframe Tab */}
      {activeTab === 'keyframe' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Keyframe Analysis</h3>
            <p className="text-gray-600">Pose landmarks and angle measurements at the optimal impact moment</p>
          </div>

          {data.keyframe_path ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl shadow-lg">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Annotated Keyframe</h4>
                <p className="text-sm text-gray-600">Frame showing pose landmarks and calculated angles</p>
              </div>

              <div className="relative">
                <img
                  src={`${BACKEND_URL}/static/${data.keyframe_path}`}
                  alt="Annotated keyframe with pose landmarks and angles"
                  className="max-w-full h-auto rounded-lg shadow-xl mx-auto border-4 border-white"
                  style={{ maxHeight: '600px' }}
                  onError={(e) => {
                    console.error('Failed to load keyframe image:', e);
                    e.currentTarget.style.display = 'none';
                  }}
                />

                {/* Image overlay with info */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg">
                  <div className="text-sm font-semibold">Impact Frame</div>
                  <div className="text-xs opacity-90">Pose Analysis</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-gray-700">Pose Landmarks</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">33 body keypoints detected</p>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-gray-700">Angle Measurements</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Biomechanical analysis</p>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-gray-700">Optimal Frame</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Peak impact moment</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">Keyframe Not Available</h4>
              <p className="text-gray-500">The annotated keyframe image could not be generated</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
