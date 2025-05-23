import { Loader2, PlusIcon } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useMask, format } from "@react-input/mask";
import {
  submitUpdateUserAsync,
  usersActions,
} from "@/src/slices/users/users-slice";
import { formatPhoneNumberOptions } from "@/src/core/formatters/phone-number";

export default function UserEditModal() {
  const usersState = useSelector<RootStore, UsersState>((state) => state.users);
  const dispatch = useAppDispatch();

  const isValid = usersState.updateState.isValid;
  const isLoading = usersState.isLoading;
  const isOpen = usersState.updateState.isOpen;

  const error = usersState.updateState.error;
  const hasError = (error?.length ?? 0) > 0;

  const phoneMask = useMask(formatPhoneNumberOptions);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        dispatch(usersActions.setUpdateStateOpen(isOpen));
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription className={hasError ? "text-destructive" : ""}>
            {hasError ? error : "User will be updated."}
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
              value={usersState.updateState.draft.phoneNumber}
              onChange={(e) => {
                dispatch(
                  usersActions.setUpdateStateDraft({
                    ...usersState.updateState.draft,
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
              value={usersState.updateState.draft.email}
              onChange={(e) => {
                dispatch(
                  usersActions.setUpdateStateDraft({
                    ...usersState.updateState.draft,
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
              value={usersState.updateState.draft.name}
              onChange={(e) => {
                dispatch(
                  usersActions.setUpdateStateDraft({
                    ...usersState.updateState.draft,
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
                value={usersState.updateState.draft.roleCode}
                onValueChange={(value) => {
                  dispatch(
                    usersActions.setUpdateStateDraft({
                      ...usersState.updateState.draft,
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
              dispatch(submitUpdateUserAsync());
            }}
          >
            {isLoading && <Loader2 className="w-6 h-6 animate-spin" />}
            Update user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
