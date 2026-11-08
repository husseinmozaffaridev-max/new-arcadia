import type { IUseCase } from "@/modules/shared/application/interfaces/use-case";
import { resolveErrorMessage } from "@/modules/shared/utils/resolve-error-message";
import { MessageType } from "../../domain/value-objects/message-type";
import type { IMessageRepository } from "../ports/sequence-message";
import type { IScenarioRepository } from "../ports/scenario";

export type CreateMessagePayload = {
  payload: {
    scenarioId: string;
    name: string;
    kind: string;
    sourceLifelineId: string;
    targetLifelineId: string;
    executionOrder: number;
    exchangedItemId?: string;
  };
  context: {
    token: string;
  };
};

export type CreateMessageResponse = {
  id: string;
  scenarioId: string;
  name: string;
  kind: string;
  sourceLifelineId: string;
  targetLifelineId: string;
  executionOrder: number;
  exchangedItemId: string | null;
  createdAt: string;
  updatedAt: string;
};

export class CreateMessageUseCase
  implements IUseCase<CreateMessagePayload, CreateMessageResponse>
{
  constructor(
    private readonly messageRepository: IMessageRepository,
    private readonly scenarioRepository: IScenarioRepository,
  ) {}

  async execute({
    payload,
  }: CreateMessagePayload): Promise<CreateMessageResponse> {
    try {
      const scenario = await this.scenarioRepository.findById({
        id: payload.scenarioId,
      });
      if (!scenario)
        throw new Error(`Scenario not found with id: ${payload.scenarioId}`);

      const messageType = MessageType.from(payload.kind);

      // Enforce single creation/destruction per lifeline (Capella constraint)
      if (payload.kind === "CREATE" || payload.kind === "DELETE") {
        const existingMessages = await this.messageRepository.findByScenarioId({
          scenarioId: payload.scenarioId,
        });

        const conflicting = existingMessages.find(
          (m) =>
            m.kind.value === payload.kind &&
            m.targetLifelineId === payload.targetLifelineId,
        );
        if (conflicting) {
          const verb = payload.kind === "CREATE" ? "created" : "destroyed";
          throw new Error(
            `A ${payload.kind} message targeting this lifeline already exists. Each lifeline can only be ${verb} once.`,
          );
        }
      }

      const message = await this.messageRepository.create({
        scenarioId: payload.scenarioId,
        name: payload.name,
        kind: messageType,
        sourceLifelineId: payload.sourceLifelineId,
        targetLifelineId: payload.targetLifelineId,
        executionOrder: payload.executionOrder,
        exchangedItemId: payload.exchangedItemId,
      });

      return message.toJSON();
    } catch (error) {
      throw new Error(resolveErrorMessage(error, "Error in create message"));
    }
  }
}
