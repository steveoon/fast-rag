'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { Plus, RefreshCw, Eye, EyeOff, Copy } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { createAccessToken } from '@/lib/actions/create-access-token';
import { setActiveToken } from '@/lib/actions/set-active-token';
import type { User } from '@supabase/supabase-js';

type Token = {
  id: string;
  token: string;
  status: 'active' | 'inactive';
  description: string | null;
  created_at: string;
};

export default function TokensList({
  initialTokens,
  clientId,
  user,
}: {
  initialTokens: Token[];
  clientId: string;
  user: User;
}) {
  const [tokens, setTokens] = React.useState<Token[]>(initialTokens);
  const [isCreatingToken, setIsCreatingToken] = React.useState(false);
  const [loadingTokenId, setLoadingTokenId] = React.useState<string | null>(null);
  const { toast } = useToast();
  const t = useTranslations('Platform.KeyManagement');
  const tUtils = useTranslations('Utils.Error');
  const [visibleTokenId, setVisibleTokenId] = React.useState<string | null>(null);

  const handleCreateToken = async (description?: string) => {
    setIsCreatingToken(true);
    try {
      const newToken = await createAccessToken(clientId, user.id, description);
      setTokens([...tokens, newToken]);
      toast({
        title: t('Toast.tokenCreated'),
        description: t('Toast.tokenCreatedDescription'),
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: t('Toast.tokenCreationFailed'),
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('Toast.tokenCreationFailed'),
          description: tUtils('unknown'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsCreatingToken(false);
    }
  };

  const handleSetActiveToken = async (tokenId: string) => {
    setLoadingTokenId(tokenId);
    try {
      await setActiveToken(clientId, tokenId, user.id);
      setTokens(
        tokens.map(token =>
          token.id === tokenId ? { ...token, status: 'active' } : { ...token, status: 'inactive' }
        )
      );
      toast({
        title: t('Toast.tokenActivated'),
        description: t('Toast.tokenActivatedDescription'),
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: t('Toast.tokenActivationFailed'),
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('Toast.tokenActivationFailed'),
          description: tUtils('unknown'),
          variant: 'destructive',
        });
      }
    } finally {
      setLoadingTokenId(null);
    }
  };

  const handleToggleVisibility = (tokenId: string) => {
    setVisibleTokenId(visibleTokenId === tokenId ? null : tokenId);
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({
      title: t('Toast.tokenCopied'),
      description: t('Toast.tokenCopiedDescription'),
    });
  };

  const columns: ColumnDef<Token>[] = [
    {
      accessorKey: 'description',
      header: t('description'),
      cell: ({ row }) => <div>{row.getValue('description') || t('noDescription')}</div>,
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => (
        <div className={row.getValue('status') === 'active' ? 'text-green-500' : 'text-gray-400'}>
          {row.getValue('status') === 'active' ? t('active') : t('inactive')}
        </div>
      ),
    },
    {
      accessorKey: 'token',
      header: t('token'),
      cell: ({ row }) => {
        const token = row.getValue('token') as string;
        const [prefix, ...rest] = token.split('.');
        const maskedKey =
          visibleTokenId === row.original.id
            ? token
            : `${prefix}.${'*'.repeat(rest.join('.').length)}`;
        return (
          <div className="flex items-center">
            {visibleTokenId === row.original.id ? (
              <span>{row.getValue('token')}</span>
            ) : (
              <span>{maskedKey}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleVisibility(row.original.id)}
            >
              {visibleTokenId === row.original.id ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyToken(row.getValue('token'))}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: t('createdAt'),
      cell: ({ row }) => <div>{new Date(row.getValue('created_at')).toLocaleString()}</div>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          onClick={() => handleSetActiveToken(row.original.id)}
          disabled={row.original.status === 'active' || loadingTokenId === row.original.id}
          size="sm"
        >
          {loadingTokenId === row.original.id ? (
            <RefreshCw className="animate-spin h-4 w-4" />
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('activate')}
            </>
          )}
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: tokens,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-8">
      <Button
        onClick={() => handleCreateToken()}
        disabled={isCreatingToken}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t('createNewToken')}
      </Button>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t('noTokens')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
