import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/src/app-store";
import afetch from "@/src/core/afetch";
import { FlightsState } from "./flights-state";
import { fetchFlightsList, getFlightsParams } from "./flights-helpers";
import { createDroneAsync } from "../drones/drones-slice";

const initialFlightsState: FlightsState = <FlightsState>{
    flights: [],
    isLoading: false,
    page: 1,
    take: 10,
    filter: "",
    total: 0,
    maxPage: 0,
    error: undefined,
    createFlight: {
        points: "",
        isValid: false,
        isOpen: false,
        error: undefined,
    },
};

export const flightsSlice = createSlice({
    name: "flights",
    initialState: initialFlightsState,
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
            state.flights = [];
            state.createFlight = {
                points: "",
                isValid: false,
                isOpen: false,
                error: undefined,
            };
        },

        setCreateFlightPoints: (state, { payload }: PayloadAction<string>) => {
            state.createFlight.points = payload;
            state.createFlight.isValid =
                payload.length > 0;
        },

        setCreateFlightOpen: (state, { payload }: PayloadAction<boolean>) => {
            state.createFlight.isOpen = payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(uploadFlightsAsync.pending, (state) => {
            state.isLoading = true;
        });

        builder.addCase(uploadFlightsAsync.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = "";
            state.flights = action.payload.flights ?? [];
            state.total = action.payload.total;
            state.maxPage = action.payload.maxPage;
        });

        builder.addCase(uploadFlightsAsync.rejected, (state, action) => {
            state.isLoading = false;
            state.error = (action.payload as string) || "Unknown error";
        });

        builder.addCase(createFlightAsync.pending, (state) => {
            state.isLoading = true;
        });

        builder.addCase(createFlightAsync.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = "";
            state.flights = action.payload.flights ?? [];
            state.total = action.payload.total;
            state.maxPage = action.payload.maxPage;
            state.createFlight.error = undefined;
            state.createFlight.isValid = false;
            state.createFlight.isOpen = false;
            state.createFlight.points = "";
        });

        builder.addCase(createDroneAsync.rejected, (state, action) => {
            state.isLoading = false;
            state.createFlight.error = (action.payload as string) || "Unknown error";
        });
    },
});

export const uploadFlightsAsync = createAsyncThunk(
    "flights/uploadFlightsAsync",
    async (_, thunkApi) => {
        const state = (thunkApi.getState() as RootState).flights;
        const params = getFlightsParams(state);
        const list = await fetchFlightsList(params);

        return thunkApi.fulfillWithValue(list);
    }
);

export const createFlightAsync = createAsyncThunk(
    "flights/createFlightAsync",
    async (_, thunkApi) => {
        const state = (thunkApi.getState() as RootState).flights;

        const response = await afetch(
            `https://local.api.letun:8080/flights`,
            {
                method: "POST",
                body: JSON.stringify({
                    points: state.createFlight.points,
                }),
            }
        );

        if (response?.status != 200) {
            const error = (await response?.text())?.trim();

            return thunkApi.rejectWithValue(error);
        }


        const params = getFlightsParams(state);
        const list = await fetchFlightsList(params);

        return thunkApi.fulfillWithValue(list);
    }
);

export const acceptFlightAsync = createAsyncThunk(
    "flights/acceptFlightAsync",
    async (id: number, thunkApi) => {
        const state = (thunkApi.getState() as RootState).flights;

        const response = await afetch(
            `https://local.api.letun:8080/flights/accept/${id}`,
            {
                method: "POST",
            }
        );

        if (response?.status != 200) {
            const error = (await response?.text())?.trim();

            return thunkApi.rejectWithValue(error);
        }


        const params = getFlightsParams(state);
        const list = await fetchFlightsList(params);

        return thunkApi.fulfillWithValue(list);
    }
);

export const rejectFlightAsync = createAsyncThunk(
    "flights/rejectFlightAsync",
    async (id: number, thunkApi) => {
        const state = (thunkApi.getState() as RootState).flights;

        const response = await afetch(
            `https://local.api.letun:8080/flights/reject/${id}`,
            {
                method: "POST",
            }
        );

        if (response?.status != 200) {
            const error = (await response?.text())?.trim();

            return thunkApi.rejectWithValue(error);
        }


        const params = getFlightsParams(state);
        const list = await fetchFlightsList(params);

        return thunkApi.fulfillWithValue(list);
    }
);



export const flightsActions = flightsSlice.actions;
