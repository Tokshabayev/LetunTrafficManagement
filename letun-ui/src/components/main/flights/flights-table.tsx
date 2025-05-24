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
import { AppDispatch, RootState } from "@/src/app-store";
import { useDispatch, useSelector } from "react-redux";
import { cn } from "@/src/core/helpers/utils";
import { acceptFlightAsync, flightsActions, rejectFlightAsync, uploadFlightsAsync } from "@/src/slices/flights/flights-slice";
import CreateFlightButton from "./create-flight-button";
import FlightTrack from "./flight-track";

export const schema = z.object({
    id: z.number(),
    droneModel: z.string(),
    droneStatus: z.string(),
    userName: z.string(),
    userEmail: z.string(),
    status: z.string(),
});

function InviteRow({ row }: { row: Row<z.infer<typeof schema>> }) {
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

export function FlightsTable() {
    const dispatch = useDispatch<AppDispatch>();

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
            accessorKey: "droneModel",
            header: "Model",
            cell: ({ row }) => {
                return <>{row.original.droneModel}</>;
            },
        },
        {
            accessorKey: "droneStatus",
            header: "Drone Status",
            cell: ({ row }) => {
                const status = row.original.droneStatus;
                switch (status) {
                    case "blocked":
                        return (
                            <Badge variant="secondary" className="px-1.5 text-muted-foreground">
                                Blocked
                            </Badge>
                        );
                    case "active":
                        return (
                            <Badge variant="outline" className="px-1.5 text-muted-foreground">
                                <CheckCircle2Icon className="text-green-500 dark:text-green-400" />
                                Active
                            </Badge>
                        );
                    case "flying":
                        return (
                            <Badge variant="outline" className="px-1.5 text-muted-foreground text-yellow-500">
                                Flying
                            </Badge>
                        );
                    default:
                        break;
                }
            },
        },
        {
            accessorKey: "userName",
            header: "User",
            cell: ({ row }) => {
                return <>{row.original.userName}</>;
            },
        },
        {
            accessorKey: "userEmail",
            header: "Email",
            cell: ({ row }) => {
                return <>{row.original.userEmail}</>;
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                switch (status) {
                    case "pending":
                        return (
                            <Badge variant="secondary" className="px-1.5 text-muted-foreground">
                                Pending
                            </Badge>
                        );
                    case "accepted":
                        return (
                            <Badge variant="outline" className="px-1.5 text-muted-foreground">
                                <CheckCircle2Icon className="text-green-500 dark:text-green-400" />
                                Accepted
                            </Badge>
                        );
                    case "rejected":
                        return (
                            <Badge variant="outline" className="px-1.5 text-muted-foreground text-red-500">
                                Rejected
                            </Badge>
                        );
                    case "started":
                        return (
                            <Badge variant="outline" className="px-1.5 text-muted-foreground text-yellow-500">
                                Started
                            </Badge>
                        );
                    case "finished":
                        return (
                            <Badge variant="outline" className="px-1.5 text-muted-foreground text-green-500">
                                Completed
                            </Badge>
                        );
                    default:
                        break;
                }
            },
        },
        {
            id: "actions",
            cell: ({ row }) => (
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
                        {row.original.status == "pending" && (
                            <DropdownMenuItem onClick={() => dispatch(acceptFlightAsync(row.original.id))}>Accept</DropdownMenuItem>
                        )}
                        {row.original.status == "pending" && (
                            <DropdownMenuItem onClick={() => dispatch(rejectFlightAsync(row.original.id))}>Reject</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => dispatch(flightsActions.setTrackFlightOpen(true))}>Track</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    function uploadFlights(debounce = 0) {
        if (timeout) {
            clearTimeout(timeout);
        }

        if (debounce > 0) {
            timeout = setTimeout(() => {
                dispatch(uploadFlightsAsync());
            }, debounce);
        } else {
            dispatch(uploadFlightsAsync());
        }
    }

    function setFilter(filter: string) {
        dispatch(flightsActions.setFilter(filter));
        uploadFlights(200);
    }

    const flightsState = useSelector((state: RootState) => state.flights);

    const dataIds: number[] = [];

    const data = React.useMemo<z.infer<typeof schema>[]>(
        () =>
            flightsState.flights.map((flight) => {
                dataIds.push(flight.id);
                return {
                    id: flight.id,
                    droneModel: flight.drone.model,
                    droneStatus: flight.drone.isFlying ? "flying" : flight.drone.isActive ? "active" : "blocked",
                    userName: flight.user.name,
                    userEmail: flight.user.email,
                    status: flight.status,
                };
            }),
        [flightsState]
    );

    const [rowSelection, setRowSelection] = React.useState({});
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    );
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const pagination = {
        pageIndex: flightsState.page - 1,
        pageSize: flightsState.take,
    };

    const setPagination = (set: Updater<PaginationState>) => {
        if (typeof set === typeof pagination) {
            dispatch(flightsActions.setPage((set as typeof pagination).pageIndex));
            dispatch(flightsActions.setTake((set as typeof pagination).pageSize));
            uploadFlights();
        }
    };

    const sortableId = React.useId();

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
        pageCount: flightsState.maxPage,
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
            <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex gap-2">
                    <Input
                        placeholder="Filter invites..."
                        onChange={(event) => setFilter(event.target.value)}
                        className="max-w-sm"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => uploadFlights()}
                        disabled={flightsState.isLoading}
                    >
                        <RefreshCcw
                            className={cn(flightsState.isLoading && "animate-spin")}
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
                    <CreateFlightButton />
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
                                            <InviteRow key={row.id} row={row} />
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
                        {flightsState.total} flight(s) found
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

            <FlightTrack />
        </Tabs>

    );
}
