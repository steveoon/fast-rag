import { ToolWithParameters } from '@/lib/actions/tools-quire/get-tools';
import { ToolDetail as ToolDetailComponent } from '@/components/tools/tool-detail';

interface ToolDetailProps {
  tool: ToolWithParameters;
  isOpen: boolean;
  onClose: () => void;
}

// 为了兼容现有代码，包装新的组件
export function ToolDetail(props: ToolDetailProps) {
  return <ToolDetailComponent {...props} />;
}
