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
import { InvitesState } from "@/src/slices/invites/invites-state";
import { useSelector } from "react-redux";
import {
  invitesActions,
  sendInviteAsync,
} from "@/src/slices/invites/invites-slice";

export function InviteUserButton() {
  const invitesState = useSelector<RootStore, InvitesState>(
    (state) => state.invites
  );
  const dispatch = useAppDispatch();

  const isValid = invitesState.inviteUser.isValid;
  const isLoading = invitesState.isLoading;
  const isOpen = invitesState.inviteUser.isOpen;

  const error = invitesState.inviteUser.error;
  const hasError = (error?.length ?? 0) > 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        dispatch(invitesActions.setInviteOpen(isOpen));
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
          <DialogTitle>Send invitation</DialogTitle>
          <DialogDescription className={hasError ? "text-destructive" : ""}>
            {hasError
              ? error
              : "Invitation will be sent to the email address you provide."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              required
              disabled={isLoading}
              className="col-span-3"
              placeholder="example@email.com"
              onChange={(e) =>
                dispatch(invitesActions.setInviteUserEmail(e.target.value))
              }
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <div className="col-span-3">
              <Select
                onValueChange={(value) =>
                  dispatch(invitesActions.setInviteUserRole(value))
                }
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    <SelectItem value="pilot">Pilot</SelectItem>
                    <SelectItem value="dispatcher">Dispatcher</SelectItem>
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
              dispatch(sendInviteAsync());
            }}
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            Send invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default InviteUserButton;
