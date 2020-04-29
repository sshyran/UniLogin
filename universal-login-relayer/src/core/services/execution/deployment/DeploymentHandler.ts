import Deployment from '../../../models/Deployment';
import {calculateDeployHash, DeviceInfo, DeployArgs, DeploymentStatus} from '@unilogin/commons';
import IRepository from '../../../models/messages/IRepository';
import {IExecutionQueue} from '../../../models/execution/IExecutionQueue';

class DeploymentHandler {
  constructor(
    private deploymentRepository: IRepository<Deployment>,
    private executionQueue: IExecutionQueue,
  ) {}

  async handle(contractAddress: string, deployArgs: DeployArgs, deviceInfo: DeviceInfo, refundPayerId?: string) {
    const deployment: Deployment = {
      ...deployArgs,
      hash: calculateDeployHash(deployArgs),
      deviceInfo,
      state: 'Queued',
      contractAddress,
      refundPayerId,
    } as Deployment;
    await this.deploymentRepository.add(deployment.hash, deployment);
    return this.executionQueue.addDeployment(deployment.hash);
  }

  async getStatus(deploymentHash: string): Promise<DeploymentStatus | null> {
    let deployment: Deployment;
    try {
      deployment = await this.deploymentRepository.get(deploymentHash);
      const status: DeploymentStatus = {
        deploymentHash,
        error: deployment.error,
        state: deployment.state,
        transactionHash: deployment.transactionHash,
      };
      return status;
    } catch (e) {
      if (e.errorType !== 'NotFound') {
        throw e;
      }
    }
    return null;
  }
}

export default DeploymentHandler;
