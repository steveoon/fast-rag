import { useState, useEffect, useTransition, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { X, Bot, Info, Settings, BookOpen, Cpu, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Chatbot } from '@/lib/db/schema/schema';
import { ToolInfo } from '@/lib/actions/get-client-tools-for-active-client';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import KnowledgeBaseSelector from './knowledge-base-selector';
import { useKnowledgeBaseStore } from '../store/knowledge-base-store';
import ModelSelector from './model-selector';

// 定义客户端工具配置类型
type ClientToolConfig = {
  client_tool_id: string;
  tool_id: string;
  tool_name: string;
  config: Record<string, unknown>;
};

// 扩展聊天机器人类型以包含工具配置
type ExtendedChatbot = Chatbot & {
  client_tools_config?: Array<ClientToolConfig> | string;
};

interface ChatbotDialogProps {
  onSubmit: (data: {
    name: string;
    description: string;
    clientToolIds: string[];
    modelId?: string;
    exampleQuestions?: string[];
  }) => void;
  isSubmitting: boolean;
  availableTools: ToolInfo[];
  hasActiveClient: boolean;
  editChatbot?: ExtendedChatbot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function SectionCard({ title, icon: Icon, children }: SectionProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 mb-4">
      <h3 className="text-base font-medium mb-3 flex items-center text-gray-900 dark:text-gray-100">
        <Icon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function ChatbotDialog({
  onSubmit,
  isSubmitting,
  availableTools,
  hasActiveClient,
  editChatbot = null,
  open,
  onOpenChange,
}: ChatbotDialogProps) {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [clientToolIds, setClientToolIds] = useState<string[]>([]);
  const [modelId, setModelId] = useState<string>('anthropic/claude-haiku-4-5');
  const [exampleQuestions, setExampleQuestions] = useState<string[]>(['', '', '']);
  const [selectedKnowledgeBaseIds, setSelectedKnowledgeBaseIds] = useState<string[]>([]);
  const [isUpdatingKnowledgeBase, startKnowledgeBaseTransition] = useTransition();
  const [dialogInitialized, setDialogInitialized] = useState(false);

  const { updateBotKnowledgeBases } = useKnowledgeBaseStore();
  const t = useTranslations('Platform.BotsManagement');

  // 对话框打开/关闭处理
  const handleDialogChange = useCallback(
    (isOpen: boolean) => {
      // 对话框关闭时，不要立即重置状态，这样可以避免闪烁
      if (!isOpen && dialogInitialized) {
        setTimeout(() => {
          // 如果不是在编辑模式，则重置表单
          if (!editChatbot) {
            resetForm();
          }
        }, 300); // 添加短暂延迟，等待对话框动画完成
      }

      onOpenChange(isOpen);
    },
    [dialogInitialized, editChatbot, onOpenChange]
  );

  useEffect(() => {
    if (open && editChatbot) {
      setName(editChatbot.name);
      setDescription(editChatbot.description || '');
      setModelId(editChatbot.model_id || 'anthropic/claude-haiku-4-5');

      // 处理示例问题
      const questions = editChatbot.example_questions as string[] | null;
      if (questions && Array.isArray(questions)) {
        // 确保有3个元素，不足的用空字符串填充
        const paddedQuestions = [...questions, '', '', ''].slice(0, 3);
        setExampleQuestions(paddedQuestions);
      } else {
        setExampleQuestions(['', '', '']);
      }

      // 处理工具配置
      let initialToolIds: string[] = [];

      if (Array.isArray(editChatbot.client_tools_config)) {
        initialToolIds = editChatbot.client_tools_config.map(t => t.client_tool_id);
      } else if (typeof editChatbot.client_tools_config === 'string') {
        try {
          const toolsConfig = JSON.parse(editChatbot.client_tools_config) as ClientToolConfig[];
          initialToolIds = toolsConfig.map(t => t.client_tool_id);
        } catch (e) {
          console.error('Error parsing client_tools_config:', e);
          initialToolIds = [];
        }
      }

      // 过滤掉已禁用的工具ID（不在availableTools中的ID）
      const availableToolIds = availableTools.map(tool => tool.id);
      const filteredToolIds = initialToolIds.filter(id => availableToolIds.includes(id));

      // 如果有被过滤掉的工具ID，记录日志
      if (filteredToolIds.length < initialToolIds.length) {
        console.log(`已过滤 ${initialToolIds.length - filteredToolIds.length} 个已禁用的工具`);
      }

      setClientToolIds(filteredToolIds);
      setDialogInitialized(true);
    } else if (open && !editChatbot) {
      resetForm();
      setDialogInitialized(true);
    } else if (!open) {
      // 对话框关闭时，重置初始化标志
      setDialogInitialized(false);
    }
  }, [editChatbot, open, availableTools]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setClientToolIds([]);
    setModelId('anthropic/claude-haiku-4-5');
    setExampleQuestions(['', '', '']);
    setSelectedKnowledgeBaseIds([]);
  };

  // 更新示例问题
  const updateExampleQuestion = (index: number, value: string) => {
    const newQuestions = [...exampleQuestions];
    newQuestions[index] = value;
    setExampleQuestions(newQuestions);
  };

  // 处理知识库选择变更
  const handleKnowledgeBaseSelectionChange = (documentVersionIds: string[]) => {
    setSelectedKnowledgeBaseIds(documentVersionIds);
  };

  const handleSubmit = async () => {
    console.log('提交表单数据...');

    // 先处理基本信息和工具更新
    onSubmit({
      name,
      description,
      clientToolIds,
      modelId,
      exampleQuestions,
    });

    // 如果是编辑模式且有机器人ID，同时更新知识库
    if (editChatbot) {
      startKnowledgeBaseTransition(async () => {
        try {
          console.log(`更新机器人 ${editChatbot.id} 的知识库配置...`);
          const result = await updateBotKnowledgeBases(editChatbot.id, selectedKnowledgeBaseIds);
          console.log('知识库更新结果:', result);
        } catch (error) {
          console.error('更新知识库配置时出错:', error);
        }
      });
    }

    handleDialogChange(false);
  };

  // 显示无激活客户端的警告信息
  const showNoActiveClientWarning = !hasActiveClient && !editChatbot;

  const headerClass = cn(
    'px-6 py-4 relative mb-4',
    'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-b border-blue-200 dark:border-blue-800'
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden rounded-lg">
        <div className={headerClass}>
          <div className="flex items-start gap-3 pr-8">
            <div className="w-10 h-10 flex-shrink-0 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-sm">
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {editChatbot ? t('editAgent') : t('createAgent')}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t('agentFormDescription')}
              </DialogDescription>
            </div>
          </div>
        </div>

        {showNoActiveClientWarning && (
          <div className="mx-6 mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200">
            <div className="flex items-center">
              <Info className="h-4 w-4 mr-2" />
              {t('noActiveClientWarning')}
            </div>
          </div>
        )}

        <ScrollArea className="max-h-[calc(85vh-12rem)] px-6">
          <div className="space-y-5 py-2">
            <SectionCard title={t('basicInfo')} icon={Info}>
              <div className="space-y-4">
                <div className="grid items-center gap-2">
                  <Label htmlFor="name" className="font-medium">
                    {t('name')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full"
                    placeholder={t('agentNamePlaceholder')}
                    disabled={showNoActiveClientWarning}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="font-medium">
                    {t('description')}
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full min-h-[100px]"
                    placeholder={t('agentDescriptionPlaceholder')}
                    disabled={showNoActiveClientWarning}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title={t('modelSelection') || 'AI 模型'} icon={Cpu}>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('modelSelectionDesc') ||
                    '选择智能体使用的 AI 模型，不同模型有不同的能力和成本。'}
                </p>
                <ModelSelector
                  value={modelId}
                  onChange={setModelId}
                  disabled={showNoActiveClientWarning}
                />
              </div>
            </SectionCard>

            <SectionCard title={t('tools')} icon={Settings}>
              <div className="space-y-3">
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800 border-b px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {availableTools.length === 0
                      ? hasActiveClient
                        ? t('noAvailableTools')
                        : t('noAvailableToolsNoActiveClient')
                      : t('selectTools')}
                  </div>
                  <div className="max-h-44 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                    {availableTools.length === 0 ? (
                      <div className="text-sm text-gray-500 py-3 px-3">
                        {hasActiveClient
                          ? t('noAvailableTools')
                          : t('noAvailableToolsNoActiveClient')}
                      </div>
                    ) : (
                      availableTools.map(tool => (
                        <div
                          key={tool.id}
                          className="flex items-center space-x-2 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                          <Checkbox
                            id={`tool-${tool.id}`}
                            checked={clientToolIds.includes(tool.id)}
                            onCheckedChange={checked => {
                              if (checked) {
                                setClientToolIds([...clientToolIds, tool.id]);
                              } else {
                                setClientToolIds(clientToolIds.filter(id => id !== tool.id));
                              }
                            }}
                            disabled={showNoActiveClientWarning}
                          />
                          <Label
                            htmlFor={`tool-${tool.id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {tool.name}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {clientToolIds.length > 0 && (
                  <div>
                    <Label className="text-sm mb-2 block text-gray-700 dark:text-gray-300">
                      {t('selectedTools')}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {clientToolIds.map(id => {
                        const tool = availableTools.find(t => t.id === id);
                        return (
                          <Badge key={id} variant="secondary" className="flex items-center gap-1">
                            <span>{tool?.name}</span>
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => {
                                setClientToolIds(clientToolIds.filter(toolId => toolId !== id));
                              }}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* 示例问题配置 */}
            <SectionCard title={t('exampleQuestions') || '示例问题'} icon={MessageSquare}>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('exampleQuestionsDesc') || '自定义欢迎页面显示的建议问题（可选）'}
                </p>
                {[0, 1, 2].map(index => (
                  <Input
                    key={index}
                    placeholder={
                      t('exampleQuestionPlaceholder', { number: index + 1 }) ||
                      `示例问题 ${index + 1}`
                    }
                    value={exampleQuestions[index] || ''}
                    onChange={e => updateExampleQuestion(index, e.target.value)}
                    disabled={showNoActiveClientWarning}
                  />
                ))}
              </div>
            </SectionCard>

            {/* 知识库配置部分 */}
            {editChatbot && dialogInitialized && (
              <SectionCard title={t('knowledgeBase') || '知识库'} icon={BookOpen}>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('selectKnowledgeBaseDesc') ||
                      '选择Agent使用的知识库文档版本，可以选择多个文档的多个版本。'}
                  </p>

                  <KnowledgeBaseSelector
                    botId={editChatbot.id}
                    onSelectionChange={handleKnowledgeBaseSelectionChange}
                    disabled={isSubmitting || isUpdatingKnowledgeBase || showNoActiveClientWarning}
                  />
                </div>
              </SectionCard>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <Button variant="secondary" onClick={() => handleDialogChange(false)} className="mr-2">
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || showNoActiveClientWarning || !name.trim()}
            className={cn(
              'bg-blue-600 hover:bg-blue-700 text-white',
              (isSubmitting || showNoActiveClientWarning || !name.trim()) && 'opacity-50'
            )}
          >
            {isSubmitting || isUpdatingKnowledgeBase ? t('submitting') : t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
