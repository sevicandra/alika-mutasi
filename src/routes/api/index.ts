import { Router } from "express";
import v1 from "./v1";
import v2 from "./v2"; 
import { Termin } from "../../models";

const router = Router();

router.use("/v1", v1);
router.use("/v2", v2); 
router.get("/", async (req, res) => {
  const termin = await Termin.findOne({
    where: { pegawai_id: "54284a82-a021-4be8-b6a6-2fdbed61fe0c" },
    include: [
      {
        association: "Ref",
      },
    ],
    order:[["Ref", "urutan", "DESC"]]
  });

  return res.json(termin);
});


export default router;