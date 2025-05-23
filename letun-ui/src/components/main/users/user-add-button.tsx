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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { RootStore, useAppDispatch } from "@/src/app-store";
import { useSelector } from "react-redux";
import { UsersState } from "@/src/slices/users/users-state";
import { useMask } from "@react-input/mask";
import {
  submitCreateUserAsync,
  usersActions,
} from "@/src/slices/users/users-slice";
import { formatPhoneNumberOptions } from "@/src/core/formatters/phone-number";

export default function UserAddButton() {
  const usersState = useSelector<RootStore, UsersState>((state) => state.users);
  const dispatch = useAppDispatch();

  const isValid = usersState.createState.isValid;
  const isLoading = usersState.isLoading;
  const isOpen = usersState.createState.isOpen;

  const error = usersState.createState.error;
  const hasError = (error?.length ?? 0) > 0;

  const phoneMask = useMask(formatPhoneNumberOptions);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        dispatch(usersActions.setCreateStateOpen(isOpen));
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
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription className={hasError ? "text-destructive" : ""}>
            {hasError ? error : "User will be added to the system."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone">Phone*</Label>
            <Input
              id="phone"
              required
              disabled={isLoading}
              className="col-span-3"
              placeholder="+7 (7##) ###-##-##"
              value={usersState.createState.draft.phoneNumber}
              onChange={(e) => {
                dispatch(
                  usersActions.setCreateStateDraft({
                    ...usersState.createState.draft,
                    phoneNumber: e.target.value,
                  })
                );
              }}
              onSubmit={(e) => {
                e.preventDefault();
                document.getElementById("phone")?.focus();
              }}
              ref={phoneMask}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              required
              disabled={isLoading}
              className="col-span-3"
              placeholder="example@email.com"
              value={usersState.createState.draft.email}
              onChange={(e) => {
                dispatch(
                  usersActions.setCreateStateDraft({
                    ...usersState.createState.draft,
                    email: e.target.value,
                  })
                );
              }}
              onSubmit={(e) => {
                e.preventDefault();
                document.getElementById("name")?.focus();
              }}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              disabled={isLoading}
              className="col-span-3"
              placeholder="John Doe"
              value={usersState.createState.draft.name}
              onChange={(e) => {
                dispatch(
                  usersActions.setCreateStateDraft({
                    ...usersState.createState.draft,
                    name: e.target.value,
                  })
                );
              }}
              onSubmit={(e) => {
                e.preventDefault();
                document.getElementById("role")?.focus();
              }}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role*
            </Label>
            <div className="col-span-3">
              <Select
                value={usersState.createState.draft.roleCode}
                onValueChange={(value) => {
                  dispatch(
                    usersActions.setCreateStateDraft({
                      ...usersState.createState.draft,
                      roleCode: value,
                    })
                  );
                }}
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!isValid || isLoading}
            onClick={() => {
              dispatch(submitCreateUserAsync());
            }}
          >
            {isLoading && <Loader2 className="w-6 h-6 animate-spin" />}
            Add user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
