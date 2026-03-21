import { Router } from 'express';
import { CycleRepository } from '../repositories/cycle.repository.js';
export function createBroadcastRouter(orchestrator) {
    const router = Router();
    const cycles = new CycleRepository();
    router.get('/current', async (req, res) => {
        const current = orchestrator.getCurrent() ?? (await orchestrator.triggerCycle());
        res.json({ ok: true, traceId: req.traceId, data: current });
    });
    router.post('/trigger', async (req, res) => {
        const current = await orchestrator.triggerCycle();
        res.json({ ok: true, traceId: req.traceId, data: current });
    });
    router.get('/events', async (req, res) => {
        const current = orchestrator.getCurrent() ?? (await orchestrator.triggerCycle());
        res.json({
            ok: true,
            traceId: req.traceId,
            data: { top5: current.top5, generatedAt: current.generatedAt }
        });
    });
    router.get('/state', (req, res) => {
        res.json({ ok: true, traceId: req.traceId, data: { state: orchestrator.getState() } });
    });
    router.get('/history', (req, res) => {
        res.json({ ok: true, traceId: req.traceId, data: cycles.listRecentStates() });
    });
    return router;
}
