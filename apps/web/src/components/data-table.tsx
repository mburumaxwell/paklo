'use client';
'use no memo';

import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type Table as TanStackTable,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDownIcon, EyeOff, PlusCircle, Settings2, XIcon } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import * as React from 'react';

import type { Icon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  type ComboboxValueType,
} from '@/components/ui/combobox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

export type DataTableFacetedFilterOption<TValue> = {
  label: string;
  value: TValue;
  icon?: React.ComponentType<{ className?: string }>;
  image?: React.ComponentType<{ className?: string }>;
};

export type DataTableToolbarAction = { title: string; icon?: Icon } & ({ href: Route } | { onClick: () => void });

export type DataTableToolbarOptionsFacet<T, Multiple extends boolean | undefined> = DataTableFacetedFilterProps<
  T,
  Multiple
> & { column: string };
export function makeToolbarOptionsFacet<T>(
  options: DataTableToolbarOptionsFacet<T, false>,
): DataTableToolbarOptionsFacet<T, false>;
export function makeToolbarOptionsFacet<T>(
  options: DataTableToolbarOptionsFacet<T, true>,
): DataTableToolbarOptionsFacet<T, true>;
export function makeToolbarOptionsFacet<T, Multiple extends boolean | undefined>(
  options: DataTableToolbarOptionsFacet<T, Multiple>,
): DataTableToolbarOptionsFacet<T, Multiple> {
  return options;
}
export type DataTableToolbarOptions = {
  /** Optional filters configuration for the toolbar. */
  filters?: {
    text?: {
      placeholder: string;
      value: string;
      onChange: (value: string) => void;
    };
    // oxlint-disable-next-line no-explicit-any -- can be any type
    facets?: DataTableToolbarOptionsFacet<any, boolean | undefined>[];
  };
  actions?: DataTableToolbarAction[];
};

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant='ghost' size='sm' className='-ml-3 h-8 data-popup-open:bg-accent'>
              <span>{title}</span>
              {column.getCanSort() && (
                <>
                  {column.getIsSorted() === 'desc' && <ArrowDown />}
                  {column.getIsSorted() === 'asc' && <ArrowUp />}
                  {!column.getIsSorted() && <ArrowUpDown />}
                </>
              )}
            </Button>
          }
        />
        <DropdownMenuContent align='start'>
          {column.getCanSort() && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUp />
                Asc
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDown />
                Desc
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.clearSorting()} disabled={!column.getIsSorted()}>
                <XIcon />
                Clear
              </DropdownMenuItem>
            </>
          )}
          {column.getCanSort() && column.getCanHide() && <DropdownMenuSeparator />}
          {column.getCanHide() && (
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <EyeOff />
              Hide
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface DataTableProps<TData, TValue = unknown> extends React.HTMLAttributes<HTMLDivElement> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  hasMore?: boolean;
  toolbar?: DataTableToolbarOptions;
  onRowClick?: (row: Row<TData>) => void;
  onMoreDataNeeded: () => void;
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  hasMore = true,
  toolbar,
  onRowClick,
  className,
  onMoreDataNeeded,
  ...props
}: DataTableProps<TData, TValue>) {
  const supportsSelect = columns.some((column) => column.id === 'select');

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    initialState: {
      pagination: { pageSize: 25 },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualFiltering: true,
    manualPagination: false,
  });

  return (
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      <DataTableToolbar table={table} {...toolbar} />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        table={table}
        supportsSelect={supportsSelect}
        hasMore={hasMore}
        onMoreDataNeeded={onMoreDataNeeded}
      />
    </div>
  );
}

interface DataTableToolbarProps<TData> extends DataTableToolbarOptions {
  table?: TanStackTable<TData>;
}

export function DataTableToolbar<TData>({ table, filters, actions }: DataTableToolbarProps<TData>) {
  // Local state for immediate UI feedback, debounced before calling onChange
  const [localTextValue, setLocalTextValue] = React.useState(filters?.text?.value || '');
  const debouncedTextValue = useDebounce(localTextValue, 300);

  // Update external state only when debounced value differs from current value
  React.useEffect(() => {
    if (filters?.text && debouncedTextValue !== filters.text.value) {
      filters.text.onChange(debouncedTextValue);
    }
  }, [filters, debouncedTextValue]);

  // check if any controlled filters are active
  const hasTextFilter = filters?.text && filters.text.value.length > 0;
  const hasFacetFilters = filters?.facets?.some((facet) =>
    Array.isArray(facet.value) ? facet.value.length > 0 : facet.value != null,
  );
  const isFiltered = hasTextFilter || hasFacetFilters;

  function handleReset() {
    setLocalTextValue('');
    filters?.text?.onChange(''); // clear text filter
    filters?.facets?.forEach((facet) => facet.onChange(facet.multiple ? [] : null)); // clear facet filters
    table?.resetColumnFilters(); // clear any internal table filters just in case
  }

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 items-center gap-2'>
        {filters?.text && (
          <Input
            placeholder={filters.text.placeholder}
            value={localTextValue}
            onChange={(event) => setLocalTextValue(event.target.value)}
            className='h-8 w-37.5 lg:w-62.5'
          />
        )}
        {filters?.facets?.map((facet) => (
          <DataTableFacetedFilter key={facet.column} {...facet} />
        ))}
        {isFiltered && (
          <Button variant='ghost' size='sm' onClick={handleReset}>
            Reset
            <XIcon />
          </Button>
        )}
      </div>
      <div className='flex items-center gap-2'>
        {table && <DataTableViewOptions table={table} />}
        {actions && actions.length > 0 && (
          <ButtonGroup>
            {(() => {
              const [firstAction, ...restActions] = actions;
              const firstOne = firstAction!;
              return (
                <>
                  <Button
                    size='sm'
                    variant='outline'
                    nativeButton={!('href' in firstOne)}
                    render={'href' in firstOne ? <Link href={firstOne.href} /> : undefined}
                    onClick={'onClick' in firstOne ? firstOne.onClick : undefined}
                  >
                    {firstOne.icon && <firstOne.icon />}
                    {firstOne.title}
                  </Button>
                  {restActions.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button size='sm' variant='outline' />}>
                        <ChevronDownIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='w-fit'>
                        {restActions.map(({ title, icon: Icon, ...rest }) => (
                          <DropdownMenuItem
                            key={title}
                            render={'href' in rest ? <Link href={rest.href} /> : undefined}
                            onClick={'onClick' in rest ? rest.onClick : undefined}
                          >
                            {Icon && <Icon className='mr-2' />}
                            {title}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              );
            })()}
          </ButtonGroup>
        )}
      </div>
    </div>
  );
}

interface DataTableFacetedFilterProps<TValue, Multiple extends boolean | undefined = false> {
  /**
   * Whether multiple items can be selected.
   * @default false
   */
  multiple?: Multiple;
  title: string;
  options: DataTableFacetedFilterOption<TValue>[];
  value: ComboboxValueType<TValue, Multiple> | null;
  onChange: (value: ComboboxValueType<TValue, Multiple> | null) => void;
}

export function DataTableFacetedFilter<TValue, Multiple extends boolean | undefined = false>({
  multiple = false,
  title,
  options,
  value,
  onChange,
}: DataTableFacetedFilterProps<TValue, Multiple>) {
  const selectedOptions = options.filter((option) =>
    Array.isArray(value)
      ? value.some((selectedValue) => Object.is(selectedValue, option.value))
      : value != null && Object.is(value, option.value),
  );
  const selected = (multiple ? selectedOptions : (selectedOptions[0] ?? null)) as ComboboxValueType<
    DataTableFacetedFilterOption<TValue>,
    Multiple
  > | null;

  return (
    <Combobox<DataTableFacetedFilterOption<TValue>, Multiple>
      multiple={multiple as Multiple}
      items={options}
      itemToStringValue={(option) => String(option.value)}
      itemToStringLabel={(option) => option.label}
      value={selected}
      onValueChange={(nextValue) => {
        if (!nextValue) {
          onChange((multiple ? [] : null) as ComboboxValueType<TValue, Multiple>);
          return;
        }

        if (multiple && Array.isArray(nextValue)) {
          onChange(nextValue.map((option) => option.value) as ComboboxValueType<TValue, Multiple>);
          return;
        }

        if (!multiple && !Array.isArray(nextValue)) {
          onChange(nextValue.value as ComboboxValueType<TValue, Multiple>);
        }
      }}
    >
      <ComboboxTrigger
        render={<Button variant='outline' size='sm' className={cn('h-8', multiple && 'border-dashed')} />}
      >
        <PlusCircle />
        {title}
        <ComboboxValue>
          {(selectedValue) => {
            if (!selectedValue) {
              return null;
            }

            if (!multiple && !Array.isArray(selectedValue)) {
              return (
                <>
                  <Separator orientation='vertical' className='mx-2 h-4' />
                  <Badge variant='secondary' className='rounded-sm px-1 font-normal'>
                    {selectedValue.label}
                  </Badge>
                </>
              );
            }

            if (!Array.isArray(selectedValue) || selectedValue.length === 0) {
              return null;
            }

            return (
              <>
                <Separator orientation='vertical' className='mx-2 h-4' />
                <Badge variant='secondary' className='rounded-sm px-1 font-normal lg:hidden'>
                  {selectedValue.length}
                </Badge>
                <div className='hidden gap-1 lg:flex'>
                  {selectedValue.length > 2 ? (
                    <Badge variant='secondary' className='rounded-sm px-1 font-normal'>
                      {selectedValue.length} selected
                    </Badge>
                  ) : (
                    selectedValue.map((option) => (
                      <Badge variant='secondary' key={String(option.value)} className='rounded-sm px-1 font-normal'>
                        {option.label}
                      </Badge>
                    ))
                  )}
                </div>
              </>
            );
          }}
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent className='w-50'>
        <ComboboxInput placeholder={title} showTrigger={false} showClear />
        <ComboboxEmpty>No results found.</ComboboxEmpty>
        <ComboboxList>
          {(option) => (
            <ComboboxItem key={String(option.value)} value={option}>
              {option.icon && <option.icon className='size-4 text-muted-foreground' />}
              {!option.icon && option.image && <option.image className='size-4 text-muted-foreground' />}
              <span>{option.label}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

interface DataTableViewOptionsProps<TData> {
  table: TanStackTable<TData>;
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant='outline' size='sm' className='ml-auto hidden h-8 lg:flex'>
            <Settings2 />
            View
          </Button>
        }
      />
      <DropdownMenuContent align='end' className='w-37.5'>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className='capitalize'
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface DataTablePaginationProps<TData> {
  table: TanStackTable<TData>;
  supportsSelect: boolean;
  hasMore: boolean;
  onMoreDataNeeded: () => void;
}

export function DataTablePagination<TData>({
  table,
  supportsSelect,
  hasMore,
  onMoreDataNeeded,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getPrePaginationRowModel().rows.length;
  const nextPageStartIndex = (pageIndex + 1) * pageSize;

  // For cursor-based pagination: detect when next page would exceed loaded data
  const needsMoreData = nextPageStartIndex >= totalRows;
  // Can go next if: table has next page loaded OR we need more data and server has more
  const canGoNext = table.getCanNextPage() || (needsMoreData && hasMore);

  function handleNextPage() {
    const currentIndex = table.getState().pagination.pageIndex;
    // Always advance to the next page
    table.setPageIndex(currentIndex + 1);
    // If we need more data from the server, trigger the load
    if (needsMoreData && hasMore) {
      onMoreDataNeeded();
    }
  }

  return (
    <div className='flex items-center justify-between'>
      <div className='flex-1 text-sm text-muted-foreground'>
        {supportsSelect && (
          <>
            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
            selected.
          </>
        )}
      </div>
      <div className='flex items-center space-x-6 lg:space-x-8'>
        <Field orientation='horizontal' className='w-fit'>
          <FieldLabel htmlFor='select-rows-per-page'>Rows per page</FieldLabel>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className='w-20' id='select-rows-per-page'>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent align='start'>
              {[5, 10, 20, 25, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Pagination className='mx-0 w-auto'>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  table.previousPage();
                }}
                aria-disabled={!table.getCanPreviousPage()}
                className={cn(!table.getCanPreviousPage() && 'pointer-events-none opacity-50')}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  handleNextPage();
                }}
                aria-disabled={!canGoNext}
                className={cn(!canGoNext && 'pointer-events-none opacity-50')}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

export function generateSelectColumn<TData>(): ColumnDef<TData> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={!table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-0.5'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-0.5'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

export type { ColumnDef, Row } from '@tanstack/react-table';
