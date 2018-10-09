import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { mutation } from '../stateful-service';
import { ChatbotCommonService } from './chatbot-common';
import { ChatbotBaseApiService } from './chatbot-base';
import {
  MediaShareService,
  IMediaShareData,
  IMediaShareBan
} from 'services/widget-settings/media-share';
import io from 'socket.io-client';

import {
  ICustomCommand,
  IDefaultCommand,
  IDafaultCommandsResponse,
  ICustomCommandsResponse,
  IChatbotAPIPostResponse,
  IChatbotAPIPutResponse,
  IChatbotAPIDeleteResponse,
  ICommandVariablesResponse,
} from './chatbot-interfaces';

// state
interface IChatbotCommandsApiServiceState {
  defaultCommandsResponse: IDafaultCommandsResponse;
  customCommandsResponse: ICustomCommandsResponse;
  commandVariablesResponse: ICommandVariablesResponse;
}

export class ChatbotCommandsApiService extends PersistentStatefulService<
  IChatbotCommandsApiServiceState
> {
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;
  @Inject() chatbotCommonService: ChatbotCommonService;
  api = this.chatbotBaseApiService.api;

  static defaultState: IChatbotCommandsApiServiceState = {
    defaultCommandsResponse: {
      commands: {},
      'link-protection': {},
      giveaway: {}
    },
    customCommandsResponse: {
      pagination: {
        current: 1,
        total: 1
      },
      data: []
    },
    commandVariablesResponse: [],
  };

  //
  // GET requests
  //

  fetchDefaultCommands() {
    return this.api('GET', 'commands/default', {}).then(
      (response: IDafaultCommandsResponse) => {
        this.UPDATE_DEFAULT_COMMANDS(response);
      }
    );
  }

  fetchCustomCommands(
    page = this.state.customCommandsResponse.pagination.current,
    query = ''
  ) {
    return this.api('GET', `commands?page=${page}&query=${query}`, {}).then(
      (response: ICustomCommandsResponse) => {
        this.UPDATE_CUSTOM_COMMANDS(response);
      }
    );
  }

  fetchCommandVariables() {
    return this.api('GET', 'commands/variables', {}).then(
      (response: ICommandVariablesResponse) => {
        this.UPDATE_COMMAND_VARIABLES(response);
      }
    );
  }


  //
  // POST, PUT requests
  //
  resetDefaultCommands() {
    return this.api('POST', 'commands/default/reset', {}).then(
      (response: IDafaultCommandsResponse) => {
        this.UPDATE_DEFAULT_COMMANDS(response);
      }
    );
  }

  resetDefaultCommand(slugName: string, commandName: string) {
    return this.api(
      'POST',
      `settings/${slugName}/commands/${commandName}/reset`,
      {}
    ).then((response: IDefaultCommand) => {
      return Promise.resolve(response);
    });
  }

  // create
  createCustomCommand(data: ICustomCommand) {
    return this.api('POST', 'commands', data).then(
      (response: ICustomCommand) => {
        this.fetchCustomCommands();
        this.chatbotCommonService.closeChildWindow();
      }
    );
  }

  // Update
  updateDefaultCommand(
    slugName: string,
    commandName: string,
    data: IDefaultCommand
  ) {
    return this.api(
      'POST',
      `settings/${slugName}/commands/${commandName}`,
      data
    ).then((response: IChatbotAPIPostResponse) => {
      if (response.success === true) {
        this.fetchDefaultCommands();
        this.chatbotCommonService.closeChildWindow();
      }
    });
  }

  updateCustomCommand(id: string, data: ICustomCommand) {
    return this.api('PUT', `commands/${id}`, data).then(
      (response: IChatbotAPIPutResponse) => {
        if (response.success === true) {
          this.fetchCustomCommands();
          this.chatbotCommonService.closeChildWindow();
        }
      }
    );
  }

  //
  // DELETE methods
  //
  deleteCustomCommand(id: string) {
    return this.api('DELETE', `commands/${id}`, {}).then(
      (response: IChatbotAPIDeleteResponse) => {
        if (response.success === true) {
          this.fetchCustomCommands();
        }
      }
    );
  }

  //
  // Mutations
  //
  @mutation()
  private UPDATE_DEFAULT_COMMANDS(response: IDafaultCommandsResponse) {
    Vue.set(this.state, 'defaultCommandsResponse', response);
  }

  @mutation()
  private UPDATE_CUSTOM_COMMANDS(response: ICustomCommandsResponse) {
    Vue.set(this.state, 'customCommandsResponse', response);
  }

  @mutation()
  private UPDATE_COMMAND_VARIABLES(response: ICommandVariablesResponse) {
    Vue.set(this.state, 'commandVariablesResponse', response);
  }
}
