import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { ArrowRight, Key, FileText, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function PlatformPage() {
  const t = useTranslations('Platform.Home');

  const guides = [
    {
      title: t('CreateApiKey.title'),
      description: t('CreateApiKey.description'),
      icon: Key,
      link: '/platform/clients-management',
      linkText: t('CreateApiKey.linkText'),
      steps: [
        t('CreateApiKey.Steps.create'),
        t('CreateApiKey.Steps.switch'),
        t('CreateApiKey.Steps.newClient'),
        t('CreateApiKey.Steps.test'),
      ],
    },
    {
      title: t('DataManagement.title'),
      description: t('DataManagement.description'),
      icon: FileText,
      link: '/platform/data-management',
      linkText: t('DataManagement.linkText'),
      steps: [
        t('DataManagement.Steps.upload'),
        t('DataManagement.Steps.delete'),
        t('DataManagement.Steps.view'),
        t('DataManagement.Steps.parse'),
      ],
    },
    {
      title: t('ClientToolsManagement.title'),
      description: t('ClientToolsManagement.description'),
      icon: Wrench,
      link: '/platform/tools-management',
      linkText: t('ClientToolsManagement.linkText'),
      steps: [
        t('ClientToolsManagement.Steps.view'),
        t('ClientToolsManagement.Steps.add'),
        t('ClientToolsManagement.Steps.edit'),
        t('ClientToolsManagement.Steps.delete'),
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-blue-900 mb-4 dark:text-blue-300">{t('title')}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide, index) => (
          <Card
            key={index}
            className="border-0 border-t-2 border-t-pink-400 dark:border-t-pink-600 shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-gray-900 flex flex-col"
          >
            <div className="flex-grow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 dark:bg-blue-900">
                  <guide.icon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <CardTitle className="text-xl font-semibold text-blue-900 dark:text-blue-300">
                  {guide.title}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {guide.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 rounded-lg mx-5 p-4">
                <ul className="space-y-1 text-gray-500 dark:text-gray-500 custom-list">
                  {guide.steps.map((step, stepIndex) => (
                    <li key={stepIndex}>{step}</li>
                  ))}
                </ul>
              </CardContent>
            </div>
            <CardFooter className="pt-4 mt-auto">
              <Link href={guide.link} passHref>
                <Button
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-800 px-2 dark:hover:bg-blue-800 dark:hover:text-blue-300 w-full justify-start"
                >
                  {guide.linkText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
