"use client";

import * as React from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  Row,
  SortingState,
  Updater,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  RefreshCcw,
  MoreVerticalIcon,
  PlusIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { z } from "zod";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { UserChartViewer } from "./user-chart-viewer";
import { AppDispatch, RootState } from "@/src/app-store";
import { useDispatch, useSelector } from "react-redux";
import {
  blockUserAsync,
  unblockUserAsync,
  uploadUsersAsync,
  usersActions,
} from "@/src/slices/users/users-slice";
import { cn } from "@/src/core/helpers/utils";
import UserAddButton from "./user-add-button";
import { UserStateType } from "@/src/slices/user/user-state";
import UserEditModal from "./user-edit-modal";

export const schema = z.object({
  id: z.number(),
  email: z.string(),
  phoneNumber: z.string(),
  roleCode: z.string(),
  roleId: z.number(),
  isActive: z.boolean(),
  name: z.string(),
});

function UserRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      ref={setNodeRef}
      className="relative z-0"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

let timeout: NodeJS.Timeout | null = null;

export function UsersTable() {
  const dispatch = useDispatch<AppDispatch>();

  function uploadUsers(debounce = 0) {
    if (timeout) {
      clearTimeout(timeout);
    }

    if (debounce > 0) {
      timeout = setTimeout(() => {
        dispatch(uploadUsersAsync());
      }, debounce);
    } else {
      dispatch(uploadUsersAsync());
    }
  }

  function setFilter(filter: string) {
    dispatch(usersActions.setFilter(filter));
    uploadUsers(200);
  }

  const usersState = useSelector((state: RootState) => state.users);

  const dataIds: number[] = [];

  const data = React.useMemo<z.infer<typeof schema>[]>(
    () =>
      usersState.users.map((user) => {
        dataIds.push(user.id);
        return user;
      }),
    [usersState]
  );

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const pagination = {
    pageIndex: usersState.page - 1,
    pageSize: usersState.take,
  };

  const setPagination = (set: Updater<PaginationState>) => {
    if (typeof set === typeof pagination) {
      dispatch(usersActions.setPage((set as typeof pagination).pageIndex));
      dispatch(usersActions.setTake((set as typeof pagination).pageSize));
      uploadUsers();
    }
  };

  const sortableId = React.useId();

  const currentUser = useSelector((state: RootState) => {
    if (state.user.type == UserStateType.loaded) {
      return state.user.user;
    }

    return undefined;
  });

  const columns: ColumnDef<z.infer<typeof schema>>[] = [
    {
      accessorKey: "id",
      header: "#",
      cell: ({ row }) => {
        return <>{row.original.id}</>;
      },
      enableHiding: false,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        return <UserChartViewer item={row.original} />;
      },
    },
    {
      accessorKey: "phone",
      header: "Phone Number",
      cell: ({ row }) => <>{row.original.phoneNumber}</>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <>{row.original.name}</>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {row.original.roleCode}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="outline" className="px-1.5 text-muted-foreground">
            <CheckCircle2Icon className="text-green-500 dark:text-green-400" />
            Active
          </Badge>
        ) : (
          <Badge variant="secondary" className="px-1.5 text-muted-foreground">
            Inactive
          </Badge>
        ),
    },
    {
      id: "actions",
      cell: ({ row }) =>
        currentUser?.id != row.original.id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                size="icon"
              >
                <MoreVerticalIcon />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem
                onClick={() => {
                  dispatch(
                    usersActions.setUpdateStateUser({
                      id: row.original.id,
                      email: row.original.email,
                      phoneNumber: row.original.phoneNumber,
                      roleCode: row.original.roleCode,
                      roleId: row.original.roleId,
                      name: row.original.name,
                      isActive: row.original.isActive,
                    })
                  );
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (row.original.isActive) {
                    dispatch(blockUserAsync(row.original.id));
                  } else {
                    dispatch(unblockUserAsync(row.original.id));
                  }
                }}
              >
                {row.original.isActive ? "Block" : "Unblock"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    pageCount: usersState.maxPage,
    manualPagination: true,
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <Tabs
      defaultValue="outline"
      className="flex w-full flex-col justify-start gap-6"
    >
      <UserEditModal />
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex gap-2">
          <Input
            placeholder="Filter users..."
            onChange={(event) => setFilter(event.target.value)}
            className="max-w-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => uploadUsers()}
            disabled={usersState.isLoading}
          >
            <RefreshCcw
              className={cn(usersState.isLoading && "animate-spin")}
            />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ColumnsIcon />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <UserAddButton />
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            id={sortableId}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <UserRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {usersState.total} user(s) found
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  );
}
