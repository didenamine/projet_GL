import { projectFacade } from "../../facades/index.js";

export const getHistoryByTask = async (req, res) => {
    try {
        const taskHistory = await projectFacade.getTaskHistory(req.params.task_id)
        res.status(200).json(taskHistory)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
