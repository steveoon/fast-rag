import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Chatbot } from '@/lib/db/schema/schema';
import { ToolInfo } from '@/lib/actions/get-client-tools-for-active-client';

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
  onSubmit: (data: { name: string; description: string; clientToolIds: string[] }) => void;
  isSubmitting: boolean;
  availableTools: ToolInfo[];
  hasActiveClient: boolean;
  editChatbot?: ExtendedChatbot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

  const t = useTranslations('Platform.BotsManagement');

  useEffect(() => {
    if (editChatbot) {
      setName(editChatbot.name);
      setDescription(editChatbot.description || '');

      // 处理工具配置
      if (Array.isArray(editChatbot.client_tools_config)) {
        setClientToolIds(editChatbot.client_tools_config.map(t => t.client_tool_id));
      } else if (typeof editChatbot.client_tools_config === 'string') {
        try {
          const toolsConfig = JSON.parse(editChatbot.client_tools_config) as ClientToolConfig[];
          setClientToolIds(toolsConfig.map(t => t.client_tool_id));
        } catch (e) {
          console.error('Error parsing client_tools_config:', e);
          setClientToolIds([]);
        }
      } else {
        setClientToolIds([]);
      }
    } else {
      resetForm();
    }
  }, [editChatbot, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setClientToolIds([]);
  };

  const handleSubmit = () => {
    onSubmit({
      name,
      description,
      clientToolIds,
    });
    if (!editChatbot) {
      resetForm();
    }
    onOpenChange(false);
  };

  // 显示无激活客户端的警告信息
  const showNoActiveClientWarning = !hasActiveClient && !editChatbot;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editChatbot ? t('editAgent') : t('createAgent')}</DialogTitle>
          <DialogDescription>
            {t('agentFormDescription')}
            {showNoActiveClientWarning && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-800">
                {t('noActiveClientWarning')}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {t('name')}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="col-span-3"
              placeholder={t('agentNamePlaceholder')}
              disabled={showNoActiveClientWarning}
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              {t('description')}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="col-span-3"
              placeholder={t('agentDescriptionPlaceholder')}
              disabled={showNoActiveClientWarning}
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Label htmlFor="tools" className="text-right pt-2">
              {t('tools')}
            </Label>
            <div className="col-span-3 space-y-4">
              <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                {availableTools.length === 0 ? (
                  <div className="text-sm text-gray-500 py-2 px-2">
                    {hasActiveClient ? t('noAvailableTools') : t('noAvailableToolsNoActiveClient')}
                  </div>
                ) : (
                  availableTools.map(tool => (
                    <div key={tool.id} className="flex items-center space-x-2 py-1">
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
                        className="text-sm font-normal cursor-pointer"
                      >
                        {tool.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>

              {clientToolIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {clientToolIds.map(id => {
                    const tool = availableTools.find(t => t.id === id);
                    return tool ? (
                      <Badge key={id} variant="secondary" className="flex items-center gap-1">
                        {tool.name}
                        <button
                          type="button"
                          className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onClick={() => setClientToolIds(clientToolIds.filter(t => t !== id))}
                          disabled={showNoActiveClientWarning}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              <div className="text-xs text-gray-500">
                {t('selectedToolsCount', { count: clientToolIds.length })}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || showNoActiveClientWarning}
          >
            {isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
