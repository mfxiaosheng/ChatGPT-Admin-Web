import { Plan, plan } from "../types";
import { AbstractDataAccessLayer } from "./abstract";

export class PlanDAL extends AbstractDataAccessLayer<Plan> {
  schema = plan;
  namespace: `${string}:` = "plan:";

  constructor() {
    super();
    this.initializePlans();
  }

  async initializePlans() {
    // Check if the plans already exist
    const basicPlanExists = await this.redis.exists(this.getKey('Pro'));
    const premiumPlanExists = await this.redis.exists(this.getKey('premium'));

    // If the plans do not exist, create them
    if (!basicPlanExists) {
      const basicPlan: Plan = {
        prices: {
          monthly: 30,
          quarterly: 79,
          yearly: 259,
        },
        limits: {
          window: {
            limit: 50,
            window: '3h',
          },
        },
      };
      await this.redis.json.set(this.getKey('Pro'), '$', basicPlan);
    }

    if (!premiumPlanExists) {
      const premiumPlan: Plan = {
        prices: {
          monthly: 129,
          quarterly: 326,
          yearly: 999,
        },
        limits: {
          window: {
            limit: 50,
            window: '1h',
          },
        },
      };
      await this.redis.json.set(this.getKey('premium'), '$', premiumPlan);
    }
  }

  async doCreate(name: string, data: Plan) {
    await this.redis.json.set(this.getKey(name), "$", data);
  }

  async read(name: string): Promise<Plan | null> {
    return (await this.redis.json.get(this.getKey(name), "$"))?.[0] ?? null;
  }

  protected doUpdate(name: string, data: Partial<Plan>) {
    return this.doJSONUpdate(name, data);
  }

  async listPlans(): Promise<Record<string, Plan>> {
    const keys = await this.redis.keys(`${this.namespace}*`);
    const values = await this.listJSONValuesOfKeys(keys);
    return Object.fromEntries(keys.map((k, i) => [k, values[i]!]));
  }

  readProperty<K extends (keyof Plan)>(
    id: string,
    property: K,
  ) {
    return this.readJSONProperty(id, property);
  }
}
