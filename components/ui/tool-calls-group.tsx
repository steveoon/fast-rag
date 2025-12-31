'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Wrench, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCallData {
  toolName: string;
  toolCallId?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  state: string;
}

interface ToolCallsGroupProps {
  toolCalls: ToolCallData[];
  renderToolDetail?: (tool: ToolCallData, index: number) => React.ReactNode;
}

interface GroupedTool {
  toolName: string;
  calls: ToolCallData[];
}

export function ToolCallsGroup({ toolCalls, renderToolDetail }: ToolCallsGroupProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());

  // 将工具调用按工具名称分组
  const groupedTools = useMemo(() => {
    const groups: Map<string, ToolCallData[]> = new Map();

    toolCalls.forEach(call => {
      const existing = groups.get(call.toolName) || [];
      existing.push(call);
      groups.set(call.toolName, existing);
    });

    return Array.from(groups.entries()).map(
      ([toolName, calls]): GroupedTool => ({
        toolName,
        calls,
      })
    );
  }, [toolCalls]);

  const toggleGroup = (toolName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(toolName)) {
      newExpanded.delete(toolName);
    } else {
      newExpanded.add(toolName);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleCall = (callId: string) => {
    const newExpanded = new Set(expandedCalls);
    if (newExpanded.has(callId)) {
      newExpanded.delete(callId);
    } else {
      newExpanded.add(callId);
    }
    setExpandedCalls(newExpanded);
  };

  // 如果没有工具调用，不显示任何内容
  if (toolCalls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      {groupedTools.map(group => {
        const isGroupExpanded = expandedGroups.has(group.toolName);
        const completedCount = group.calls.filter(
          c => c.state === 'output-available' || c.state === 'result'
        ).length;
        const allCompleted = completedCount === group.calls.length;

        return (
          <div
            key={group.toolName}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            {/* 分组标题 */}
            <button
              onClick={() => toggleGroup(group.toolName)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm',
                'bg-gray-50 dark:bg-gray-800/50',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'transition-colors'
              )}
            >
              {isGroupExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              )}
              <Wrench className="h-3.5 w-3.5 text-orange-500 shrink-0" />
              <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                {group.toolName}
              </span>
              <span
                className={cn(
                  'ml-auto text-xs px-1.5 py-0.5 rounded-full shrink-0',
                  allCompleted
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                )}
              >
                {group.calls.length > 1 ? `${completedCount}/${group.calls.length}` : null}
                {allCompleted && <Check className="inline h-3 w-3 ml-0.5" />}
              </span>
            </button>

            {/* 展开后的调用列表 */}
            {isGroupExpanded && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                {group.calls.map((call, idx) => {
                  const callId = call.toolCallId || `${group.toolName}-${idx}`;
                  const isCallExpanded = expandedCalls.has(callId);
                  const isCompleted = call.state === 'output-available' || call.state === 'result';

                  return (
                    <div
                      key={callId}
                      className="border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
                    >
                      {/* 单个调用的标题 */}
                      <button
                        onClick={() => toggleCall(callId)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-1.5 text-xs',
                          'hover:bg-gray-50 dark:hover:bg-gray-800/30',
                          'transition-colors'
                        )}
                      >
                        {isCallExpanded ? (
                          <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
                        )}
                        <span className="text-gray-500 dark:text-gray-400">调用 #{idx + 1}</span>
                        {call.input && (
                          <span className="text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
                            {getInputPreview(call.input)}
                          </span>
                        )}
                        <span className="ml-auto shrink-0">
                          {isCompleted ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                          )}
                        </span>
                      </button>

                      {/* 单个调用的详情 */}
                      {isCallExpanded && (
                        <div className="px-3 pb-2 bg-gray-50/50 dark:bg-gray-900/30">
                          {renderToolDetail ? (
                            renderToolDetail(call, idx)
                          ) : (
                            <DefaultToolDetail call={call} />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// 获取输入参数的预览文本
function getInputPreview(input: Record<string, unknown>): string {
  const entries = Object.entries(input);
  if (entries.length === 0) return '';

  const [key, value] = entries[0];
  const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
  const preview = valueStr.slice(0, 30);
  return `${key}: ${preview}${valueStr.length > 30 ? '...' : ''}`;
}

// 默认的工具详情渲染
function DefaultToolDetail({ call }: { call: ToolCallData }) {
  return (
    <div className="text-xs space-y-2">
      {call.input && (
        <div>
          <div className="font-medium text-blue-600 dark:text-blue-400 mb-1">参数:</div>
          <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(call.input, null, 2)}
          </pre>
        </div>
      )}
      {call.output !== undefined && (
        <div>
          <div className="font-medium text-green-600 dark:text-green-400 mb-1">结果:</div>
          <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-32">
            {typeof call.output === 'string' ? call.output : JSON.stringify(call.output, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
