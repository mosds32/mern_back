import { app } from "./app.js";
import dotenv  from "dotenv";
import { BigIntSerealizer } from "./config/BigIntSerealizer.js";

BigIntSerealizer();
dotenv.config({
    path : "./.env"
});

app.listen(process.env.PORT || 5050,
    ()=> {
        console.log(
        "⚙️ "+` Server is Running @ ${process.env.HTTP_PROTOCOL}://${process.env.ORIGIN}:${process.env.PORT}`
        );
    }
);