import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/src/app-store";
import afetch from "@/src/core/afetch";
import { DronesState } from "./drones-state";
import { fetchDronesList, getDroneParams } from "./drones-helpers";

const initialDronesState: DronesState = <DronesState>{
    drones: [],
    isLoading: false,
    page: 1,
    take: 10,
    filter: "",
    total: 0,
    maxPage: 0,
    error: undefined,
    createDrone: {
        model: "",
        weightLimit: "",
        battery: "",
        isValid: false,
        isOpen: false,
        error: undefined,
    },
};

export const dronesSlice = createSlice({
    name: "drones",
    initialState: initialDronesState,
    reducers: {
        setPage: (state, { payload }: PayloadAction<number>) => {
            state.page = payload;
        },

        setTake: (state, { payload }: PayloadAction<number>) => {
            state.take = payload;
        },

        setFilter: (state, { payload }: PayloadAction<string>) => {
            state.filter = payload;
        },

        clear: (state) => {
            state.page = 1;
            state.take = 10;
            state.filter = "";
            state.total = 0;
            state.maxPage = 0;
            state.drones = [];
            state.createDrone = {
                model: "",
                weightLimit: "",
                battery: "",
                isValid: false,
                isOpen: false,
                error: undefined,
            };
        },

        setCreateDroneModel: (state, { payload }: PayloadAction<string>) => {
            state.createDrone.model = payload;
            state.createDrone.isValid =
                payload.length > 0;
        },

        setCreateDroneWeightLimit: (state, { payload }: PayloadAction<string>) => {
            state.createDrone.weightLimit = payload;
            state.createDrone.isValid =
                payload.length > 0;
        },

        setCreateDroneBattery: (state, { payload }: PayloadAction<string>) => {
            state.createDrone.battery = payload;
            state.createDrone.isValid =
                payload.length > 0;
        },

        setCreateDroneOpen: (state, { payload }: PayloadAction<boolean>) => {
            state.createDrone.isOpen = payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(uploadDronesAsync.pending, (state) => {
            state.isLoading = true;
        });

        builder.addCase(uploadDronesAsync.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = "";
            state.drones = action.payload.drones ?? [];

            console.log(action.payload);
            state.total = action.payload.total;
            state.maxPage = action.payload.maxPage;
        });

        builder.addCase(uploadDronesAsync.rejected, (state, action) => {
            state.isLoading = false;
            state.error = (action.payload as string) || "Unknown error";
        });

        builder.addCase(createDroneAsync.pending, (state) => {
            state.isLoading = true;
        });

        builder.addCase(createDroneAsync.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = "";
            state.drones = action.payload.drones ?? [];
            state.total = action.payload.total;
            state.maxPage = action.payload.maxPage;
            state.createDrone.error = undefined;
            state.createDrone.isValid = false;
            state.createDrone.isOpen = false;
            state.createDrone.model = "";
            state.createDrone.weightLimit = "";
            state.createDrone.battery = "";
        });

        builder.addCase(createDroneAsync.rejected, (state, action) => {
            state.isLoading = false;
            state.createDrone.error = (action.payload as string) || "Unknown error";
        });
    },
});

export const uploadDronesAsync = createAsyncThunk(
    "drones/uploadDronesAsync",
    async (_, thunkApi) => {
        const state = (thunkApi.getState() as RootState).drones;
        const params = getDroneParams(state);
        const list = await fetchDronesList(params);

        return thunkApi.fulfillWithValue(list);
    }
);

export const createDroneAsync = createAsyncThunk(
    "drones/createDroneAsync",
    async (_, thunkApi) => {
        const state = (thunkApi.getState() as RootState).drones;

        const response = await afetch(
            `https://local.api.letun:8080/drones`,
            {
                method: "POST",
                body: JSON.stringify({
                    model: state.createDrone.model,
                    weightLimit: state.createDrone.weightLimit,
                    battery: state.createDrone.battery,
                }),
            }
        );

        if (response?.status != 200) {
            const error = (await response?.text())?.trim();

            return thunkApi.rejectWithValue(error);
        }


        const params = getDroneParams(state);
        const list = await fetchDronesList(params);

        return thunkApi.fulfillWithValue(list);
    }
);


export const dronesActions = dronesSlice.actions;
