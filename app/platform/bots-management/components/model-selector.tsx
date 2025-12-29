'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAvailableModels } from '@/lib/actions/get-ai-models';
import { AiModel } from '@/lib/db/schema/schema';
import { Loader2 } from 'lucide-react';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
}

// Provider 显示名称映射
const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  qwen: '通义千问 (Qwen)',
  openrouter: 'OpenRouter',
  ohmygpt: 'OhMyGPT',
  moonshotai: 'MoonshotAI',
  deepseek: 'DeepSeek',
};

export default function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const [models, setModels] = useState<AiModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const availableModels = await getAvailableModels('chat');
        setModels(availableModels);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  // 按 provider 分组模型
  const modelsByProvider = models.reduce(
    (acc, model) => {
      const provider = model.provider;
      if (!acc[provider]) {
        acc[provider] = [];
      }
      acc[provider].push(model);
      return acc;
    },
    {} as Record<string, AiModel[]>
  );

  // 获取 provider 的排序顺序
  const providerOrder = [
    'anthropic',
    'openai',
    'google',
    'qwen',
    'openrouter',
    'ohmygpt',
    'moonshotai',
    'deepseek',
  ];

  const sortedProviders = Object.keys(modelsByProvider).sort((a, b) => {
    const orderA = providerOrder.indexOf(a);
    const orderB = providerOrder.indexOf(b);
    return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">加载模型列表...</span>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="选择 AI 模型" />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {sortedProviders.map(provider => (
          <SelectGroup key={provider}>
            <SelectLabel className="font-semibold text-gray-900 dark:text-gray-100">
              {PROVIDER_LABELS[provider] || provider}
            </SelectLabel>
            {modelsByProvider[provider].map(model => (
              <SelectItem key={model.model_id} value={model.model_id}>
                <div className="flex flex-col">
                  <span>{model.display_name}</span>
                  {model.description && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {model.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
