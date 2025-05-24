import { Loader2, PlusIcon } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { RootStore, useAppDispatch } from "@/src/app-store";
import { useSelector } from "react-redux";
import { FlightsState } from "@/src/slices/flights/flights-state";
import { createFlightAsync, flightsActions } from "@/src/slices/flights/flights-slice";

export function CreateFlightButton() {
    const flightsState = useSelector<RootStore, FlightsState>(
        (state) => state.flights
    );
    const dispatch = useAppDispatch();

    const isValid = flightsState.createFlight.isValid;
    const isLoading = flightsState.isLoading;
    const isOpen = flightsState.createFlight.isOpen;

    const error = flightsState.createFlight.error;
    const hasError = (error?.length ?? 0) > 0;

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(isOpen) => {
                dispatch(flightsActions.setCreateFlightOpen(isOpen));
            }}
        >
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <PlusIcon />
                    <span className="hidden lg:inline">Add</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add flight</DialogTitle>
                    <DialogDescription className={hasError ? "text-destructive" : ""}>
                        {hasError
                            ? error
                            : "Flight will be added to the list."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="points">Points</Label>
                        <Input
                            id="points"
                            required
                            disabled={isLoading}
                            className="col-span-3"
                            placeholder="Coordinates"
                            onChange={(e) =>
                                dispatch(flightsActions.setCreateFlightPoints(e.target.value))
                            }
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        disabled={!isValid || isLoading}
                        onClick={() => {
                            dispatch(createFlightAsync());
                        }}
                    >
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                        Add
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default CreateFlightButton;
