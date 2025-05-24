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
import { DronesState } from "@/src/slices/drones/drones-state";
import { createDroneAsync, dronesActions } from "@/src/slices/drones/drones-slice";

export function CreateDroneButton() {
    const dronesState = useSelector<RootStore, DronesState>(
        (state) => state.drones
    );
    const dispatch = useAppDispatch();

    const isValid = dronesState.createDrone.isValid;
    const isLoading = dronesState.isLoading;
    const isOpen = dronesState.createDrone.isOpen;

    const error = dronesState.createDrone.error;
    const hasError = (error?.length ?? 0) > 0;

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(isOpen) => {
                dispatch(dronesActions.setCreateDroneOpen(isOpen));
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
                    <DialogTitle>Add drone</DialogTitle>
                    <DialogDescription className={hasError ? "text-destructive" : ""}>
                        {hasError
                            ? error
                            : "Drone will be added to the list."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="model">Model</Label>
                        <Input
                            id="model"
                            required
                            disabled={isLoading}
                            className="col-span-3"
                            placeholder="ASX-10"
                            onChange={(e) =>
                                dispatch(dronesActions.setCreateDroneModel(e.target.value))
                            }
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="weightLimit">Weight Limit</Label>
                        <Input
                            id="weightLimit"
                            required
                            disabled={isLoading}
                            className="col-span-3"
                            placeholder="100"
                            onChange={(e) =>
                                dispatch(dronesActions.setCreateDroneWeightLimit(e.target.value))
                            }
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="weightLimit">Battery Limit</Label>
                        <Input
                            id="battery"
                            required
                            disabled={isLoading}
                            className="col-span-3"
                            placeholder="100"
                            onChange={(e) =>
                                dispatch(dronesActions.setCreateDroneWeightLimit(e.target.value))
                            }
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        disabled={!isValid || isLoading}
                        onClick={() => {
                            dispatch(createDroneAsync());
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

export default CreateDroneButton;
