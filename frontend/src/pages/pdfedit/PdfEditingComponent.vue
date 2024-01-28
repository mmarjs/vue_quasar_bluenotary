<template>
  <div class="columns is-marginless pdfmain" style="height: 100vh; width: 100vw" @click="pageclick">
    <template v-if="requestId">
      <template v-if="!docFound">
        <div class="col-12 has-text-centered" style="margin: auto">
          <p class="has-text-grey-dark has-text-weight-bold">
            {{ docNotFoundError }}
          </p>
        </div>
      </template>
      <template v-else>
        <template v-if="pdfLoaded">
          <div class="col-md-2 col-sm-12 pdf-edit-column" style="padding:0 !important">
            <template v-if="pdfMode !== 'template'">
              <div class="video-container clearfix">
                <!-- <div style="width: 100%; text-align: center; padding: 12px; style: bold">Video Call Session</div> -->
                <div v-if="sessionid === 'simulator' && videoCallStarted" class="dummyblock">
                  <img class="video-thumb-dummy" src="~assets/kim-nguyen.jpg" alt="kim-nguyen" />
                </div>
                <div v-if="!videoCallStarted" class="q-pa-md">
                  Waiting for video feed...
                </div>
                <div class="wrtcvid" :class="{ 'simltor': sessionid === 'simulator' && videoCallStarted }">
                  <vue-webrtc ref="webrtc"
                              width="100%"
                              height="100%"
                              :room-id="videoCallRoomNumber"
                              :enable-logs="true"
                              :socket-u-r-l="videoCallSocketUrl"
                              :peer-options="videoCallPeerOptions"
                              camera-height="160"
                              @joined-room="logEvent"
                              @left-room="logEvent"
                              @opened-room="logEvent"
                              @share-started="logEvent"
                              @share-stopped="logEvent" />
                </div>
              </div>
              <div v-if="!joinedAsWitness" id="notorizationTypeCard" class="q-px-md">
                <q-btn
                  v-if="$user.role === 'notary'"
                  align="left"
                  outline
                  rounded
                  icon="fingerprint"
                  class="q-mb-md full-width"
                  @click="checkUserDetails"
                >
                  &nbsp;Check Signer ID
                </q-btn>
                <br />
                <div v-if="multiSignerUserDocs && multiSignerUserDocs.length" class="columns is-multiline" style="margin-top: 12px">
                  <div class="column is-12" style="font-weight: bold">
                    Additional Signers ({{ additionalSignersLabel }})
                  </div>
                  <template v-for="signerUserItem in multiSignerUserDocs">
                    <div :key="signerUserItem._id + 'first'" class="column is-9" style="overflow-wrap: anywhere">
                      <template v-if="signerUserItem.email">
                        {{ signerUserItem.email }}
                      </template>
                    </div>
                    <div :key="signerUserItem._id + 'second'" class="column is-3">
                      <q-icon v-if="signerUserItem.userActive" name="remove_red_eye" style="cursor: pointer; color: blue; font-size: 20px; float: right">
                        <q-tooltip>
                          Additional Signer is Online
                        </q-tooltip>
                      </q-icon>
                      <q-icon name="info" style="cursor: pointer; color: black; font-size: 20px; float: right">
                        <q-tooltip>
                          {{ signerUserItem.currentStage }}
                        </q-tooltip>
                      </q-icon>
                    </div>
                  </template>
                </div>
                <q-btn
                  v-if="$user.role === 'notary' && pdfMode !== 'template'"
                  outline
                  rounded
                  icon="person_add"
                  class="full-width q-mb-md"
                  :disabled="!enableWitnessAddButton"
                  @click="addWitnessClicked"
                >
                  &nbsp; Add Witness
                </q-btn>
                <div v-if="pdfMode !== 'template' && sessionid !== 'simulator'" class="columns is-multiline" style="margin-top: 12px;">
                  <div class="col-md-2 col-sm-12" style="font-weight: bold">
                    Witnesses ({{ witnessButtonLabel }})
                  </div>
                  <template v-for="currentWitness in currentSessionWitnessUsers">
                    <div :key="currentWitness._id + 'first'" class="column is-8">
                      <template v-if="currentWitness.witnessdoc">
                        {{ currentWitness.witnessdoc.firstName }} {{ currentWitness.witnessdoc.lastName }}
                      </template>
                      <template v-if="currentWitness.userdoc">
                        {{ currentWitness.userdoc.name }}
                      </template>
                    </div>
                    <div :key="currentWitness._id + 'second'" class="column is-4">
                      <q-icon name="delete" style="cursor: pointer; color: red; font-size: 20px;float: right" @click="witnessRemoveClicked(currentWitness)">
                        <q-tooltip>
                          Remove witness from this session
                        </q-tooltip>
                      </q-icon>
                      <q-icon v-if="currentWitness.userActive" name="remove_red_eye" style="cursor: pointer; color: blue; font-size: 20px; float: right">
                        <q-tooltip>
                          Witness is Online
                        </q-tooltip>
                      </q-icon>
                    </div>
                  </template>
                </div>
                <div v-if="$user.role === 'notary'" class="">
                  <q-select
                    v-model="notorizationType"
                    filled
                    multiple
                    :options="options"
                    options-cover
                    use-chips
                    label="Notarization Type"
                  />
                </div>
              </div>
              <div v-if="!joinedAsWitness" id="notorizationPriceCard" class="q-pa-md">
                <h2 class="q-mb-sm" style="font-size:1rem">
                  Cost of Notarization
                  <q-icon v-if="$user.role === 'notary' && $user.memberType !== 'free'" name="create" style="cursor: pointer; color: blue; font-size: 30px; float: right" @click="editCostOfNotarizationClicked">
                    <q-tooltip>
                      Edit Custom Charges for this Session
                    </q-tooltip>
                  </q-icon>
                </h2>
                <div class="columns is-multiline q-pa-sm">
                  <template v-for="tempCost,index in costOfNotarization">
                    <div :key="'tempCostname' + index" class="column is-8 q-pb-md">
                      {{ tempCost.name }}
                    </div>
                    <div :key="'tempCostprice' + index" class="column is-4">{{ tempCost.currency }}{{ tempCost.price }}</div>
                  </template>
                  <div class="column is-8"><strong>Total</strong></div>
                  <div class="column is-4"><strong>{{ finalCostOfNotarization }}</strong></div>
                </div>
              </div>
            </template>
          </div>
          <!-- Pdf Pages -->
          <div class="col-md-8 col-sm-12 pdfprvbox" style="padding-left:0;padding-right:0">
            <div
              id="upper-text"
              class="pdf-upper-text bg-white row no-wrap justify-between"
            >
              <div class="col is-3 column inline tersec">
                <span v-if="pdfMode !== 'template'" class="col q-pl-md" style="font-size:1.1rem;">Session {{ sessionCode }}</span>

                <span
                  v-if="$user.role === 'notary' && pdfMode !== 'template' && !joinedAsWitness"
                  class="col"
                  style="color:blue; text-decoration:underline; cursor:pointer; width: fit-content"
                  @click="terminateClicked"
                >
                  Terminate Session
                </span>
                <span v-if="pdfMode === 'template'" class="col" style="font-size:1.1rem;">Template: {{ sessionFullData && sessionFullData.originalDocument && sessionFullData.originalDocument.name }}</span>
              </div>
              <div v-if="pdfMode !== 'template' && sessionid !== 'simulator'" class="column is-6 inline" style="padding:2px;padding-left:15px;">
                <q-select v-model="currentDocumentSelected" filled :options="allDocumentList" option-value="_id" option-label="name" label="Current Document" :dense="true" :disable="$user.role !== 'notary' || !documentNagivationTimerEnabled">
                  <template v-if="$user.role === 'notary'" v-slot:before>
                    <q-btn round dense flat icon="navigate_before" :disable="!documentPickerNavigationButtons.prev || !documentNagivationTimerEnabled" @click="documentPickerNavigationButtonClicked('prev')">
                      <q-tooltip>
                        <template v-if="documentNagivationTimerEnabled">
                          Goto Previous Document
                        </template>
                        <template v-else>
                          Please wait 10 Seconds before moving on to next file
                        </template>
                      </q-tooltip>
                    </q-btn>
                  </template>
                  <template v-if="$user.role === 'notary'" v-slot:after>
                    <q-btn round dense flat icon="navigate_next" :disable="!documentPickerNavigationButtons.next || !documentNagivationTimerEnabled" @click="documentPickerNavigationButtonClicked('next')">
                      <q-tooltip>
                        <template v-if="documentNagivationTimerEnabled">
                          Goto Next Document
                        </template>
                        <template v-else>
                          Please wait 10 Seconds before moving on to next file
                        </template>
                      </q-tooltip>
                    </q-btn>
                  </template>
                </q-select>
              </div>
              <div v-if="!joinedAsWitness" class="column is-3">
                <button
                  v-if="$user.role === 'notary' && pdfMode !== 'template'"
                  class="button is-primary inline"
                  :disabled="!showCompleteButton"
                  @click="completePDF"
                >
                  Complete Session
                </button>
                <q-icon v-if="$user.role === 'notary' && pdfMode !== 'template' && !showCompleteButton" class="inline" name="info" style="cursor: pointer; color: black; font-size: 20px; margin-top: 10px; margin-left: 5px">
                  <q-tooltip>
                    {{ showCompleteButtonInfoText }}
                  </q-tooltip>
                </q-icon>
                <button
                  v-if="pdfMode === 'template'"
                  class="button is-danger"
                  style="margin-right: 10px;"
                  @click="cancelTemplateFields"
                >
                  Cancel
                </button>
                <button
                  v-if="pdfMode === 'template'"
                  class="button is-primary"
                  @click="saveTemplateFields"
                >
                  Save Template Fields
                </button>
                <div v-if="$user.role === 'customer' && customerTotalFields" style="padding: 0px 10px; border: 1px solid black; border-radius: 5px;">
                  <span>
                    <span style="font-weight: bold">{{ customerTotalFieldsDataInserted }} / {{ customerTotalFields }}</span> Completed
                    <q-tooltip>
                      The inputs requested by Notary, will be navigable from here
                    </q-tooltip>
                  </span>
                  <q-icon name="arrow_forward" style="cursor: pointer; color: blue; font-size: 20px; float: right; padding-left: 3px; padding-top: 2px" @click="nextCustomerInput($event)">
                    <q-tooltip>
                      Goto Next Input
                    </q-tooltip>
                  </q-icon>
                  <q-icon name="arrow_back" style="cursor: pointer; color: blue; font-size: 20px; float: right; padding-top: 2px" @click="prevCustomerInput($event)">
                    <q-tooltip>
                      Goto Previous Input
                    </q-tooltip>
                  </q-icon>
                </div>
              </div>
            </div>
            <div
              id="pdf-pages-container"
              class="page-container pdf-pages-container"
            />
          </div>
          <!-- Recipients & Fields -->
          <div
            v-if="!joinedAsWitness"
            class="col-md-2- col-sm-12 pdf-edit-column pdfdrgdrop mbhide"
            style="border-left: 1px solid #d6d6d6; padding-left: 0px"
          >
            <div class="fieldheader">Drag & Drop Toolbox</div>
            <div v-for="(field, index) in signatureFields" :key="'userfield' + index" style="padding: 12px;border-bottom: 1px solid #d6d6d6;" :style="[selectedDroppableField.name === field.name ? {'background': '#8ce0f5'} : {}]" class="dd-itm" @click="droppableFieldClicked($event, field)">
              <div class="signature-element" draggable="true" @dragstart="startDrag($event, JSON.stringify(field), field.name, field.type, field.placeholder_type, field.textToInsert, field.height, field.width)">
                <div class="fieldicon" style="display: inline-block; width: 30px"><q-icon :name="field.icon" style="margin-right: 6px; font-size: 18px;" /></div>
                <div class="fieldtext" style="display: inline-block">{{ field.name }}</div>
              </div>
            </div>
            <q-btn
              v-if="$user.role === 'notary'"
              icon="copy_all"
              outline
              rounded
              class="q-ma-md dd-itm"
              @click="addNewPage"
            >
              &nbsp; Add Blank Page
            </q-btn>
          </div>
        </template>
      </template>
    </template>
    <template v-else>
      Invalid Request ID
    </template>
    <!-- modal for check customer details -->
    <q-dialog v-model="showCheckUserDetailsModal">
      <q-card style="">
        <q-card-section>
          <h5>Check Signer ID</h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div style="font-weight: bold; font-size: 20px">Primary Signer Details</div>
          <div v-if="sessionFullData && sessionFullData.customerUser && sessionFullData.customerUser.email">Primary Signer Email : <b>{{ sessionFullData.customerUser.email }}</b> </div>
          <!-- Add image here -->
          <div v-if="sessionFullData && sessionFullData.customerUser && sessionFullData.customerUser.identityData && sessionFullData.customerUser.identityData.frontPhotoIdUrl" style="text-align: center">
            <img class="icardimg" :src="sessionFullData.customerUser.identityData.frontPhotoIdUrl" alt="Front Image" />
          </div>
          <div v-else>
            Front Image Not Found
          </div>
          <div class="q-pt-sm">
            <div class="">
              Processing Outcome:
              <strong v-if="sessionid === 'simulator'"> Pass</strong>
              {{ userDetailsModalResponse.workflowOutcome }}
            </div>
            <div class="">
              Document Verification Result:
              <strong v-if="sessionid === 'simulator'">: Pass</strong>
              {{ userDetailsModalResponse.documentValidationResult }}
            </div>
            <div class="">
              Document Expiration Result:
              <strong v-if="sessionid === 'simulator'">: Pass</strong>
              {{ userDetailsModalResponse.documentExpirationResult }}
            </div>
          </div>
          <!-- <q-table
            :loading="checkUserDetailsModalLoading"
            title="Identification Details"
            :data="userDetailsModalDataRows"
            :columns="userDetailsModalDataColumns"
            :pagination="userDetailsModalDataPagination"
            row-key="displayName"
          /> -->
          <div v-if="multiSignerUserDocs && multiSignerUserDocs.length" class="q-pt-sm">
            <div style="font-weight: bold; font-size: 20px">Additional Signer Details</div>
            <div v-for="multiSignerUserDoc in multiSignerUserDocs" :key="'additionalSigner' + multiSignerUserDoc._id" style="padding-top: 12px;">
              <div>Additional Signer Email: <b>{{ multiSignerUserDoc.email }}</b> </div>
              <div v-if="multiSignerUserDoc.identityData && multiSignerUserDoc.identityData.frontPhotoIdUrl" style="text-align: center">
                <img class="icardimg" :src="multiSignerUserDoc.identityData && multiSignerUserDoc.identityData.frontPhotoIdUrl" alt="Front Image" />
              </div>
              <div v-else>
                Front Image Not Found
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            v-close-popup
            class="btn-primary"
            label="Close"
            @click="closeUserDetailsModal()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- modal for customer complete step -->
    <q-dialog v-model="showCustomerThankYouModal">
      <q-card>
        <q-card-section>
          <h5>Session Complete</h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <h2 class="q-pa-sm has-text-centered">{{ showCustomerThankYouModalText }}</h2>
          <div class="q-pa-sm has-text-centered">You will be redirected back to dashboard, in 5 seconds...</div>
        </q-card-section>

        <q-card-actions align="center">
          <q-btn
            v-close-popup
            label="Back to Dashboard"
            color="primary"
            @click="closeCustomerThankyouModal()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- modal for waiting room -->
    <q-dialog v-model="waitingRoomModalShow">
      <q-card style="min-width: 60%">
        <q-card-section>
          <h5>Waiting Room</h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="columns is-multiline" style="margin-top: 20px">
            <div class="column is-10">All Parties Have Joined</div>
            <div class="column is-2" style="font-weight: bold">
              <div v-if="!waitingRoomChecklist.allPartiesJoined">
                <q-spinner-gears size="30px" color="primary" />
              </div>
              <div v-else>
                <q-icon name="check" style="font-size: 30px; color: green" />
              </div>
            </div>
            <div class="column is-10">Socket Connection Established Correctly</div>
            <div class="column is-2" style="font-weight: bold">
              <div v-if="!waitingRoomChecklist.socketConnectionEstablished">
                <q-spinner-gears size="30px" color="primary" />
              </div>
              <div v-else>
                <q-icon name="check" style="font-size: 30px; color: green" />
              </div>
            </div>
            <div class="column is-10">Video Enabled By All Parties</div>
            <div class="column is-2" style="font-weight: bold">
              <div v-if="!waitingRoomChecklist.videoEnabledByAllParties">
                <q-spinner-gears size="30px" color="primary" />
              </div>
              <div v-else>
                <q-icon name="check" style="font-size: 30px; color: green" />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
    <!-- modal for complete pdf loading -->
    <q-dialog v-model="completePDFLoadingModal">
      <q-card>
        <q-card-section>
          <h3>Please wait while we process the session...</h3>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-if="completePDFLoadingDetails.currentFileName">File Name : <b>{{ completePDFLoadingDetails.currentFileName }}</b></div>
          <div>{{ completePDFLoadingDetails.progressText }}</div>
          <q-linear-progress v-if="$user.role === 'notary'" stripe rounded size="20px" :value="completePDFLoadingDetails.progress" class="q-mt-sm" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- modal for browser incapability -->
    <!-- <q-dialog v-model="browserNotCompatible" persistent>
      <q-card>
        <q-card-section>
          <h3>Please use Chrome browser for notarization sessions</h3>
        </q-card-section>
      </q-card>
    </q-dialog> -->

    <!-- modal for add witness -->
    <q-dialog v-model="showAddWitnessModal" persistent>
      <q-card>
        <q-card-section>
          <h5>Add a witness to this session</h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row">
            <div class="col-12">
              <q-radio v-model="witnessSelectionType" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="old_witness" label="My Witnesses" />
              <q-radio v-model="witnessSelectionType" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="new_witness" label="Add New Witness" />
              <q-radio v-model="witnessSelectionType" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="bn_witness_open_call" label="BlueNotary Witness" />
            </div>
            <div v-if="witnessSelectionType === 'bn_witness_open_call'" class="col-12 row q-mt-md">
              <div class="col-2 q-ml-sm">
                <img src="https://bluenotary.us/assets/img/logo-b3.png" />
              </div>
              <p class="q-px-md col-9">We will call a notary in our network to serve as a witness for the session. The fee is $10 for this service. </p>
            </div>
            <div v-if="witnessSelectionType === 'old_witness'" class="col-12">
              <q-select
                v-model="witnessSelectionOptions.selectedValue"
                filled
                label="Select Witness to Add to Session"
                :options="witnessSelectionOptions.data"
                style="width: 500px"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No results
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
            <template v-if="witnessSelectionType === 'new_witness'">
              <div class="column is-6">
                <q-input v-model="currentWitnessModal.firstName" outlined label="First Name" :rules="[val => !!val || 'Field is required']">
                  <template v-slot:prepend>
                    <q-icon name="account_circle" />
                  </template>
                </q-input>
              </div>
              <div class="column is-6">
                <q-input v-model="currentWitnessModal.lastName" outlined label="Last Name" :rules="[val => !!val || 'Field is required']">
                  <template v-slot:prepend>
                    <q-icon name="badge" />
                  </template>
                </q-input>
              </div>
              <div class="column is-6">
                <q-input v-model="currentWitnessModal.email" outlined label="Email" :rules="[val => !!val || 'Field is required']">
                  <template v-slot:prepend>
                    <q-icon name="email" />
                  </template>
                </q-input>
              </div>
              <div class="column is-6">
                <q-input v-model="currentWitnessModal.phoneNumber" outlined label="Phone Number" :rules="[val => !!val || 'Field is required']">
                  <template v-slot:prepend>
                    <q-icon name="phone" />
                  </template>
                </q-input>
              </div>
              <p class="q-px-md">We will send an email to the witness with instructions about how to join the session. The fee is $10 for this service.</p>
            </template>
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-mb-lg">
          <q-btn rounded color="blue" class="q-pa-sm" label="Add Witness" :disable="disableAddWitnessSaveButton" @click="addWitnessSaveClicked" />
          <q-btn v-close-popup flat label="Cancel" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Witness Deletion Confirmation Modal -->
    <q-dialog v-model="witnessDeleteConfirmationModal" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <div class="q-ml-sm">
            Please confirm the removal of following Witness from Session
            <br />
            Witness Name : <template v-if="witnessDeleteDoc.witnessdoc">
              {{ witnessDeleteDoc.witnessdoc.firstName }} {{ witnessDeleteDoc.witnessdoc.lastName }}
            </template>
            <template v-if="witnessDeleteDoc.userdoc">
              {{ witnessDeleteDoc.userdoc.name }}
            </template>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancel" color="primary" />
          <q-btn v-close-popup flat label="Remove Witness" color="primary" @click="witnessRemoveDialogClicked" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Witness Deleted From Session Modal shown to Witness -->
    <q-dialog v-model="witnessRemovedFromSessionShownToWitnessModal" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <div class="q-ml-sm">
            Your participation as Witness is no longer required by signing parties.
            <br />
            Thank you for joining in.
            <br />
            (Redirecting back to dashboard in 10 seconds)
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- modal for add witness -->
    <q-dialog v-model="editCostOfNotarizationModal" persistent>
      <q-card>
        <q-card-section>
          <h5>Modify/Add custom fees for this session</h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-for="customChargeDoc in customChargesEditValues" :key="customChargeDoc.id" class="row" style="margin-top: 8px;">
            <div class="col-6">
              <q-input v-model="customChargeDoc.particular" dense filled label="Custom Charge Name" type="string" style="padding-right: 20px;" />
            </div>
            <div class="col-4">
              <q-input v-model="customChargeDoc.amount" dense filled label="Custom Charge Value (in USD)" type="number" />
            </div>
            <div class="col-2">
              <q-btn flat outline color="primary" icon="clear" style="font-size: 17px" @click="removeChargesButton(customChargeDoc.id)" />
            </div>
          </div>
          <q-btn icon="add" outline class="q-mt-sm" round @click="addMoreChargesButton()" />
        </q-card-section>
        <q-card-actions align="center" class="q-mb-lg">
          <q-btn rounded color="blue" class="q-pa-sm" label="Modify Fees" @click="editCostOfNotarizationSaveClicked" />
          <q-btn v-close-popup flat label="Cancel" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- modal for pdf session turned off -->
    <q-dialog v-model="$user.turnOffPdfSession" persistent>
      <q-card>
        <q-card-section>
          <h3>Due to some technical issues, Notary sessions are turned off. They will be turned on shortly.</h3>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>

import Vue from "vue";
import _ from "lodash";
import moment from "moment";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import PDFJSWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import { PDFDocument, rgb } from "pdf-lib";
import $ from "jquery";
import "jquery-ui/ui/widgets/draggable";
import "jquery-ui/ui/widgets/resizable";
import "jquery-ui/themes/base/resizable.css";
// import "jquery-ui-touch-punch";

import * as io from "socket.io-client";
import WebRTC from "vue-webrtc";
import DroppedFieldComponent from "./DroppedFieldComponent.vue";
import VueEventBus from "../../plugins/eventbus.js";

window.io = io;
Vue.use(WebRTC);

pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJSWorker;

export default {
  name: "PdfEditingComponent",
  components: {
  },
  props: {
  },
  data () {
    return {
      sessionid: false,
      isLoading: true,
      docFound: true,
      pdfLoaded: false,
      pdfurl: false,
      docNotFoundError: "",
      SCALE: 1.2,
      SMALL_SCALE: 0.2,
      recipientSignatures: {},
      recipients: [],
      selectedRecipientEmail: "",
      requestId: "testing",
      signatureMethod: "",
      requestDoc: undefined,
      signatureHeight: 30,
      signatureWidth: 100,
      signatureFields: [],
      totalPages: 0,
      provider: false,
      currentElementId: 1,
      allDroppedElements: [],
      allDroppedElementsVueComponents: {},
      allDroppedElementsDocIdWise: {},
      sessionFullData: {},
      realDragStarted: false,
      allImagesData: {},
      videoCallStarted: false,
      notorizationType: [],
      attachCertificate: false,
      showCompleteButton: false,
      showCompleteButtonInfoText: "Atleast 1 Notary Seal is required Per Document to complete the session",
      costOfNotarization: [],
      videoCallRoomNumber: "bnTempSession",
      videoCallSocketUrl: "",
      videoCallPeerOptions: {
        initiator: false,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            // { urls: "stun:global.stun.twilio.com:3478?transport=udp" },
            { urls: "turn:159.223.165.183:3478", username: "bluenotaryuser", credential: "bluenotaryuserpassword" }
          ]
        },
      },
      showCheckUserDetailsModal: false,
      checkUserDetailsModalLoading: false,
      userDetailsModalDataRows: [],
      userDetailsModalDataColumns: [
        { name: "group", label: "Field Group", field: "group" },
        { name: "displayName", label: "Field Name", field: "displayName" },
        {
          name: "value", label: "Field Value", field: "value", style: "font-weight: bold",
        }
      ],
      multiSignerUserDetailsModalData: [],
      userDetailsModalDataPagination: {
        rowsPerPage: 0
      },
      userDetailsModalFrontImageUrl: false,
      userDetailsModalBackImageUrl: false,
      userDetailsModalResponse: {},
      showCustomerThankYouModal: false,
      showCustomerThankYouModalText: "Notary has completed the session",
      outputFileObject: false,
      waitingRoomChecklist: {
        allPartiesJoined: false,
        socketConnectionEstablished: false,
        screenRecordingStarted: true,
        videoEnabledByAllParties: false
      },
      currentPageUsers: [],
      completePDFClicked: false,
      completePDFLoadingModal: false,
      completePDFLoadingDetails: {
        progress: 0,
        progressText: "",
        currentFileName: false,
      },
      renderingSocketFields: false,
      firstPageViewPort: false,
      emptyPagesAdded: 0,
      emptyPagesAddedDocIdWise: {},
      allNotaryCertificates: [],
      // browserNotCompatible: false,
      sendFullSessionFieldsIfDataFound: false,
      pdfMode: false,
      showAddWitnessModal: false,
      currentWitnessModal: {
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: ""
      },
      allWitnesses: [],
      witnessSelectionType: "old_witness",
      witnessSelectionOptions: {
        loading: true,
        dataFetched: false,
        data: [],
        selectedValue: []
      },
      currentSessionWitnessUsers: [],
      maxWitnessJoined: 0,
      joinedAsWitness: false,
      witnessDeleteConfirmationModal: false,
      witnessRemovedFromSessionShownToWitnessModal: false,
      witnessDeleteDoc: {},
      videoCallSocketIntervalFunction: false,
      videoCallSocketIntervalFunctionForNoConnectivity: false,
      videoRecordingStarted: false,
      options: [
        "Acknowledgement", "Jurat", "Oath/Affirmation", "Copy Certification", "Proof of Execution by Subscribing Witness", "Protest", " Signature Witnessing"
      ],
      multiSignerUserDocs: [],
      internetConnectionSpeedTestDone: false,
      internetConnectionSpeedTestErrorShown: false,
      disableAddWitnessSaveButton: false,
      currentDocumentSelected: "",
      allDocumentList: [],
      allDocumentListKeyedById: {},
      documentFileCacheById: {},
      documentPickerNavigationButtons: {
        prev: false,
        next: false
      },
      documentNagivationTimerEnabled: true,
      isTouchDevice: false,
      selectedDroppableField: {},
      customerTotalFields: 0,
      customerTotalFieldsDataInserted: 0,
      currentHighlightedElementId: "",
      previousHighlightedElementId: "",
      editCostOfNotarizationModal: false,
      customChargesEditValues: [{
        id: "input000",
        particular: "",
        amount: "0"
      }],
      customChargesModified: false
    };
  },
  computed: {
    sessionCode() {
      return `#${(this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData._id.substr(this.sessionFullData.newSessionModelData._id.length - 5).toUpperCase()) || "XXXX"}`;
    },
    finalCostOfNotarization () {
      let finalCost = 0;
      let currencyString = "$";
      _.map(this.costOfNotarization, (cost) => {
        finalCost += parseFloat(cost.price);
        currencyString = cost.currency;
      });
      return currencyString + String(finalCost.toFixed(2));
    },
    witnessButtonLabel() {
      const totalWitnesses = this.currentSessionWitnessUsers.length;
      let activeWitnesses = 0;
      _.map(this.currentSessionWitnessUsers, (currentWitnessDoc) => {
        if (currentWitnessDoc.userActive) {
          activeWitnesses += 1;
        }
      });
      return `${activeWitnesses} / ${totalWitnesses} Active`;
    },
    additionalSignersLabel() {
      const totalAdditionalSigners = this.multiSignerUserDocs.length;
      let activeAdditionalSigner = 0;
      _.map(this.multiSignerUserDocs, (signerUserDoc) => {
        if (signerUserDoc.userActive) {
          activeAdditionalSigner += 1;
        }
      });
      return `${activeAdditionalSigner} / ${totalAdditionalSigners} Active`;
    },
    waitingRoomModalShow() {
      // return false;
      let showWaitingRoom = false;
      if (this.sessionid === "simulator" || this.pdfMode === "template") {
        return false;
      }
      _.map(this.waitingRoomChecklist, (checkListValue) => {
        if (!checkListValue) {
          showWaitingRoom = true;
        }
      });
      if (this.showCustomerThankYouModal) {
        return false;
      }
      return showWaitingRoom;
    },
    enableWitnessAddButton() {
      const currentWitnessUsersLength = this.currentSessionWitnessUsers.length;
      if (!this.$user.totalWitnessLimit) {
        return true;
      }
      if (this.$user.totalWitnessLimit > currentWitnessUsersLength) {
        return true;
      }
      return false;
    }
  },
  watch: {
     allDroppedElements: {
       handler(value) {
         console.log("value changed in dropped elements", value);
          // value = _.uniqBy(value, "elementId");
          this.allDroppedElementsDocIdWise[this.currentDocumentSelected._id] = value;
          console.log("this.allDroppedElementsDocIdWise", this.allDroppedElementsDocIdWise);
          if (this.pdfMode === "template") {
            this.showCompleteButton = true;
          }
          this.recalculateDroppedElementsNextPreviousData();
       },
       deep: true
     },
     allDroppedElementsDocIdWise: {
       handler(value) {
         console.log("value changed in dropped elements docid wise", value);
         let totalNotarySeals = 0;
         const documentWiseNotarySeals = {};
          _.map(value, (droppedElements, tempDocumentId) => {
            documentWiseNotarySeals[tempDocumentId] = 0;
            _.map(droppedElements, (droppedElement) => {
              if (droppedElement.imageFieldType === "notary_seal") {
                totalNotarySeals += 1;
                documentWiseNotarySeals[tempDocumentId] += 1;
              }
            });
          });
          console.log("totalNotarySeals", totalNotarySeals);
          let notaryFee = "25.00";
          if (this.sessionFullData && this.sessionFullData.statePricingDoc && this.sessionFullData.statePricingDoc.notaryFee) {
            notaryFee = this.sessionFullData.statePricingDoc.notaryFee;
          }
          let serviceFee = "2.00";
          if (this.sessionFullData && this.sessionFullData.statePricingDoc && this.sessionFullData.statePricingDoc.serviceFee) {
            serviceFee = this.sessionFullData.statePricingDoc.serviceFee;
          }
          let notaryFeeText = "Notarization + 1 Notary Seal";
          let dontAddExtraCharges = false;
          if (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.sessionType === "loan_signing") {
            dontAddExtraCharges = true;
            if (this.sessionFullData && this.sessionFullData.statePricingDoc.loan_signing) {
              if (this.sessionFullData.statePricingDoc.loan_signing.notaryFee) {
                notaryFee = this.sessionFullData.statePricingDoc.loan_signing.notaryFee;
              }
              if (this.sessionFullData.statePricingDoc.loan_signing.notaryFeeText) {
                notaryFeeText = this.sessionFullData.statePricingDoc.loan_signing.notaryFeeText;
              }
              if (this.sessionFullData.statePricingDoc.loan_signing.serviceFee) {
                serviceFee = this.sessionFullData.statePricingDoc.loan_signing.serviceFee;
              }
            }
          }
          let extraSeal = "8.00";
          if (this.sessionFullData && this.sessionFullData.statePricingDoc && this.sessionFullData.statePricingDoc.extraSeal) {
            extraSeal = this.sessionFullData.statePricingDoc.extraSeal;
          }
          let witnessFees = "10.00";
          if (this.sessionFullData && this.sessionFullData.statePricingDoc && this.sessionFullData.statePricingDoc.witnessFees) {
            witnessFees = this.sessionFullData.statePricingDoc.witnessFees;
          }
          let additionalSignerFees = "5.00";
          if (this.sessionFullData && this.sessionFullData.statePricingDoc && this.sessionFullData.statePricingDoc.additionalSignerFees) {
            additionalSignerFees = this.sessionFullData.statePricingDoc.witnessFees;
          }
          this.costOfNotarization = [];
          if (totalNotarySeals > 0) {
            this.costOfNotarization.push({
              name: notaryFeeText,
              price: notaryFee,
              currency: "$"
            });
            let extraChargesDocs = [];
            if (this.sessionFullData && this.sessionFullData.notaryUser && this.sessionFullData.notaryUser.notaryCustomCharges) {
              if (this.sessionFullData.newSessionModelData.sessionType) {
                extraChargesDocs = this.sessionFullData.notaryUser.notaryCustomCharges[this.sessionFullData.newSessionModelData.sessionType] || [];
              } else {
                extraChargesDocs = this.sessionFullData.notaryUser.notaryCustomCharges.gnw || [];
              }
            }
            if (this.customChargesEditValues) {
              extraChargesDocs = JSON.parse(JSON.stringify(this.customChargesEditValues));
              extraChargesDocs = _.filter(extraChargesDocs, (chargeDoc) => parseFloat(chargeDoc.amount));
            }
            _.map(extraChargesDocs, (extraChargeDoc) => {
              const extraChargeAmount = parseFloat(extraChargeDoc.amount);
              this.costOfNotarization.push({
                name: extraChargeDoc.particular,
                price: extraChargeAmount.toFixed(2),
                currency: "$"
              });
            });
            if (!dontAddExtraCharges) {
              const extraSeals = totalNotarySeals - 1;
              if (extraSeals) {
                this.costOfNotarization.push({
                  name: `Extra Notary Seal x${String(extraSeals)}`,
                  price: `${String(extraSeals * parseFloat(extraSeal))}.00`,
                  currency: "$"
                });
              }
              if (this.maxWitnessJoined) {
                this.costOfNotarization.push({
                  name: `Witnesses Joined x${String(this.maxWitnessJoined)}`,
                  price: `${String(this.maxWitnessJoined * parseFloat(witnessFees))}.00`,
                  currency: "$"
                });
              }
              if (this.sessionFullData.newSessionModelData.multiSignerList && this.sessionFullData.newSessionModelData.multiSignerList.length) {
                this.costOfNotarization.push({
                  name: `Additional Signers x${String(this.sessionFullData.newSessionModelData.multiSignerList.length)}`,
                  price: `${String(this.sessionFullData.newSessionModelData.multiSignerList.length * parseFloat(additionalSignerFees))}.00`,
                  currency: "$"
                });
              }
            }
            if (parseFloat(serviceFee)) {
              this.costOfNotarization.push({
                name: "Service Fee",
                price: serviceFee,
                currency: "$"
              });
            }
            let tempAllDocumentHaveSeals = true;
            const documentNameWithoutSeals = [];
            _.map(documentWiseNotarySeals, (documentCount, tempDocumentId) => {
              if (!documentCount) {
                tempAllDocumentHaveSeals = false;
                const documentDoc = this.allDocumentListKeyedById[tempDocumentId];
                if (documentDoc) {
                  documentNameWithoutSeals.push(documentDoc.name);
                }
              }
            });
            if (tempAllDocumentHaveSeals) {
              this.showCompleteButton = true;
            } else {
              this.showCompleteButton = false;
              this.showCompleteButtonInfoText = `Following Documents do not have Notary Seals : ${documentNameWithoutSeals.join(", ")}`;
            }
          } else {
            this.showCompleteButton = false;
            this.showCompleteButtonInfoText = "At least 1 Notary Seal is required per document to complete the session";
          }
       },
       deep: true
     },
     emptyPagesAdded: {
       handler(value) {
         this.emptyPagesAddedDocIdWise[this.currentDocumentSelected._id] = value;
       }
     },
     "waitingRoomChecklist.videoEnabledByAllParties": {
       handler(value) {
         console.log("value changed handler called", value);
         console.log("handler called");
         if (value) {
           this.waitingRoomChecklist.allPartiesJoined = true;
         }
       }
     },
     completePDFLoadingModal: {
      handler(value) {
        if (value) {
          window.onbeforeunload = () => "";
          if (this.$user.role === "notary") {
            this.socketRequest("session_completion_started");
          }
        } else {
          window.onbeforeunload = null;
          if (this.$user.role === "notary") {
            this.socketRequest("session_completion_finished");
          }
        }
      }
    },
    waitingRoomModalShow: {
      handler(value) {
        if (!value && !this.videoRecordingStarted) {
          this.startVideoRecording();
        }
      }
    },
    currentDocumentSelected: {
      handler(value) {
        this.documentNagivationTimerEnabled = false;
        setTimeout(() => {
          this.documentNagivationTimerEnabled = true;
        }, 10000);
        let documentIndex = false;
        let localIndex = 0;
        _.map(this.allDocumentList, (tempDocumentDoc) => {
          if (tempDocumentDoc._id === value._id) {
            documentIndex = localIndex;
          }
          localIndex += 1;
        });
        if (documentIndex === 0) {
          this.documentPickerNavigationButtons.prev = false;
        } else {
          this.documentPickerNavigationButtons.prev = true;
        }
        if (documentIndex === this.allDocumentList.length - 1) {
          this.documentPickerNavigationButtons.next = false;
        } else {
          this.documentPickerNavigationButtons.next = true;
        }
        if (this.currentDocumentSelected && this.currentDocumentSelected.url) {
          this.pdfUrl = this.currentDocumentSelected.url;
        }
        if (this.currentDocumentSelected && this.currentDocumentSelected.documentUrl) {
          this.pdfUrl = this.currentDocumentSelected.documentUrl;
        }
        this.renderPdf(JSON.parse(JSON.stringify(this.currentDocumentSelected)));
        this.allDroppedElements = this.allDroppedElementsDocIdWise[this.currentDocumentSelected._id] || [];
        this.socketRequest("current_selected_document_changed", {
          currentSelectedDocumentId: this.currentDocumentSelected._id
        });
        this.emptyPagesAdded = this.emptyPagesAddedDocIdWise[this.currentDocumentSelected._id] || 0;
      }
    }
  },
  async mounted () {
    // if (navigator.userAgent.search("Firefox") > -1) {
    //   this.browserNotCompatible = true;
    // }
    this.isTouchDevice = !!("ontouchstart" in window);
    this.sessionid = (this.$route.params && this.$route.params.id) || false;
    if (this.$route.query.mode) {
      this.pdfMode = this.$route.query.mode;
      if (this.pdfMode === "template") {
        this.showCompleteButton = true;
      }
    }

    if (this.sessionid === "simulator") {
      this.disableAddWitnessSaveButton = true;
    }

    if (this.$route.query.witness) {
      try {
        const dataToSave = {
          sessionid: this.sessionid
        };
        const urlToUse = "session/joinSessionAsWitness";
        const response = await Vue.axios.post(urlToUse, dataToSave);
        console.log(response);
        this.$q.notify({
          color: "primary",
          position: "bottom",
          message: "Successfully joined as Witness. Loading PDF Session",
        });
      } catch (error) {
        return;
      }
      this.joinedAsWitness = true;
    }
    this.videoCallSocketUrl = "/";
    if (window.location && window.location.host === "localhost:8080") {
      this.videoCallSocketUrl = "localhost:3002";
    }
    if (this.sessionid) {
      window.currentSessionId = this.sessionid;
      if (!await this.fetchSessionDoc()) {
        return;
      }
    }
    // this.startVideoRecording();
    if (!this.pdfUrl) {
      this.$q.notify({
        message: "Session Document Not Found. Please try again.",
        color: "red"
      });
      return;
    }
    // this.renderPdf(JSON.parse(JSON.stringify(this.currentDocumentSelected)));
    const allPossibleFields = [
      {
        name: this.$user.name,
        type: "static_text",
        icon: "person",
        height: "25px",
        width: "175px",
        user: ["customer", "notary"]
      },
      {
        name: moment().format("MM/DD/YYYY"),
        type: "static_text",
        icon: "calendar_today",
        height: "25px",
        width: "100px",
        user: ["customer", "notary"]
      },
      {
        name: "Signature",
        type: "signature",
        icon: "draw",
        height: "50px",
        width: "120px",
        user: ["customer", "notary"]
      },
      {
        name: "Checkmark",
        type: "checkmark",
        icon: "check_box",
        height: "25px",
        width: "25px",
        user: ["customer", "notary"]
      },
      {
        name: "Text",
        type: "input_text",
        icon: "title",
        height: "50px",
        width: "250px",
        user: ["customer", "notary"]
      },
      {
        name: "Notary Seal",
        type: "image",
        image_field_type: "notary_seal",
        icon: "approval",
        user: ["notary"],
        height: "100px",
        width: "300px"
      },
      {
        name: "Notary Certificate",
        type: "notary_certificate",
        icon: "history_edu",
        user: ["notary"],
        height: "400px",
        width: "300px"
      },
      {
        name: "Signer's Full Name",
        textToInsert: (this.sessionFullData && this.sessionFullData.customerUser && this.sessionFullData.customerUser.name) || "Signer's Full Name",
        type: "static_text",
        icon: "person",
        user: ["notary"],
        height: "25px",
        width: "175px"
      },
      {
        name: "Signer's Signature",
        type: "placeholder",
        icon: "draw",
        placeholder_type: "signature",
        height: "50px",
        width: "120px",
        user: ["notary"]
      },
      {
        name: "Signer's Free Text",
        type: "placeholder",
        icon: "title",
        placeholder_type: "input_text",
        height: "50px",
        width: "120px",
        user: ["notary"]
      },
      {
        name: "Whiteout Block",
        type: "whiteout",
        icon: "clear",
        user: ["notary"],
        height: "50px",
        width: "120px"
      },
    ];
    this.signatureFields = _.filter(allPossibleFields, (possibleField) => {
      let showField = possibleField.user.indexOf(this.$user.role) !== -1;
      if (showField && showField.image_type === "notary_seal") {
        if (!this.allImagesData.notarySealImage) {
          showField = false;
        }
      }
      return showField;
    });
    VueEventBus.$on("SOCKET_UPDATES", async (socketData) => {
      console.log("socketData", JSON.parse(JSON.stringify(socketData)));
      if (socketData.sessionid === this.sessionid) {
        if (typeof socketData.event !== "undefined") {
          if (socketData.event === "dropped_field_updates") {
            const { updatedField } = socketData;
            if (!updatedField) {
              return;
            }
            let fieldFound = false;
            let fieldFoundIndex = false;
            let counter = 0;
            this.allDroppedElements = _.compact(this.allDroppedElements);
            _.map(this.allDroppedElements, (localDroppedElement) => {
              if (localDroppedElement.elementId === updatedField.elementId) {
                fieldFound = true;
                fieldFoundIndex = counter;
              }
              counter += 1;
            });
            if (!_.isEqual(this.allDroppedElements[fieldFoundIndex], updatedField)) {
              console.log(fieldFound, updatedField, this.allDroppedElements[fieldFoundIndex], this.allDroppedElements[fieldFoundIndex] === updatedField, _.isEqual(this.allDroppedElements[fieldFoundIndex], updatedField));
              if (fieldFound) {
                console.log($(`#signature-element${updatedField.elementId}`));
                this.deleteBox($(`#signature-element${updatedField.elementId}`), updatedField.elementId, false);
                if (!updatedField.removed) {
                  this.createNewSignatureElement(updatedField, fieldFoundIndex, true);
                }
              } else {
                this.createNewSignatureElement(updatedField, false, true);
              }
            }
          }
          if (socketData.event === "session_terminated") {
            if (socketData.userId !== this.$user._id) {
              this.endVideoCall();
              this.$router.replace("/business");
              this.$q.notify({
                message: "Session has been terminated by the Notary.",
                color: "black"
              });
            }
          }
          if (socketData.event === "session_completion_started") {
            if (socketData.userId !== this.$user._id) {
              this.completePDFLoadingModal = true;
            }
          }
          if (socketData.event === "session_completion_finished") {
            if (socketData.userId !== this.$user._id) {
              this.completePDFLoadingModal = false;
            }
          }
          if (socketData.event === "session_completed") {
            if (socketData.userId !== this.$user._id) {
              this.showCustomerThankYouModal = true;
              this.$q.notify({
                message: "Session is Completed by Notary",
                color: "black"
              });
              setTimeout(() => {
                this.endVideoCall();
                this.$router.replace(`/business?confirmationSession=${this.sessionid}&paymentDone=success`);
              }, 7000);
            }
          }
          if (socketData.event === "session_completed_payment_failed") {
            if (socketData.userId !== this.$user._id) {
              this.showCustomerThankYouModal = true;
              this.showCustomerThankYouModalText = "Session is Completed by Notary. Payment from your end has failed. Please re-enter payment details to view the completed PDF.";
              this.$q.notify({
                message: "Session is Completed by Notary. Payment from your end has failed. Please re-enter payment details to view the completed PDF.",
                color: "black"
              });
              setTimeout(() => {
                this.endVideoCall();
                this.$router.replace(`/business?confirmationSession=${this.sessionid}&paymentDone=failure`);
              }, 7000);
            }
          }
          if (socketData.event === "join_success") {
            if (socketData.userId === String(this.$user._id)) {
              this.waitingRoomChecklist.socketConnectionEstablished = true;
            }
          }
          if (socketData.event === "session_witness_management_changed") {
            this.getSessionWitnessDetails();
          }
          if (socketData.event === "current_session_users") {
            const newUsers = _.difference(socketData.finalUserIds, this.currentPageUsers);
            console.log("newUsers", newUsers);
            const notaryUserId = this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.notaryUserId;
            if (this.$user.role === "customer" && newUsers.length && _.includes(newUsers, notaryUserId)) {
              if (!(this.sessionFullData && notaryUserId)) {
                await this.fetchSessionDoc();
              }
            }
            if (!(this.pdfMode === "template" || this.sessionid === "simulator")) {
              const sessionWitnessUrl = `/session/getAllSessionWitnesses/${this.sessionid}`;
              let sessionFullData = false;
              try {
                sessionFullData = await Vue.axios.get(sessionWitnessUrl);
              } catch (error) {}
              const currentSessionWitnessUsers = (sessionFullData && sessionFullData.data && sessionFullData.data.sessionWitnesses) || [];
              let localActiveWitness = 0;
              this.currentSessionWitnessUsers = _.map(currentSessionWitnessUsers, (witnessUserDoc) => {
                if (witnessUserDoc.userid && _.includes(socketData.finalUserIds, witnessUserDoc.userid)) {
                  witnessUserDoc.userActive = true;
                  localActiveWitness += 1;
                } else {
                  witnessUserDoc.userActive = false;
                }
                return witnessUserDoc;
              });
              if (localActiveWitness > this.maxWitnessJoined) {
                this.maxWitnessJoined = localActiveWitness;
                if (this.$user.role === "customer" && !this.joinedAsWitness) {
                  const url = `session/saveSessionData/${this.sessionid}`;
                  const dataToSave = {
                    maxWitnessJoined: this.maxWitnessJoined
                  };
                  Vue.axios.post(url, {
                    data: dataToSave
                  });
                }
              }
            }
            this.currentPageUsers = socketData.finalUserIds;
            this.multiSignerUserDocs = _.map(this.multiSignerUserDocs, (signerUserDoc) => {
              console.log(this.currentPageUsers, signerUserDoc._id, _.includes(this.currentPageUsers, signerUserDoc._id));
              if (_.includes(this.currentPageUsers, signerUserDoc._id)) {
                signerUserDoc.userActive = true;
              } else {
                signerUserDoc.userActive = false;
              }
              return signerUserDoc;
            });
            let allPartiesJoined = true;
            if (this.currentPageUsers.indexOf(this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.userId) === -1) {
              allPartiesJoined = false;
            }
            console.log("notaryUserId", notaryUserId, this.currentPageUsers);
            if (notaryUserId) {
              if (this.currentPageUsers.indexOf(notaryUserId) === -1) {
                allPartiesJoined = false;
              } else if (this.currentPageUsers.length < 2) {
                allPartiesJoined = false;
              }
            }
            console.log("allPartiesJoined", allPartiesJoined);
            this.waitingRoomChecklist.allPartiesJoined = allPartiesJoined;
            // if (!allPartiesJoined) {
            //   this.waitingRoomChecklist.screenRecordingStarted = false;
            // }
            // if (this.waitingRoomChecklist.screenRecordingStarted) {
            //   this.socketRequest("video_capture_started", this.sessionid);
            // }
            if (this.$user.role === "notary") {
              this.socketRequest("current_selected_document_changed", {
                currentSelectedDocumentId: this.currentDocumentSelected._id
              });
              this.sendFullSessionFields();
            }
          }
          if (socketData.event === "video_capture_started") {
            if (this.$user.role !== "notary") {
              // this.waitingRoomChecklist.screenRecordingStarted = true;
            }
          }
          if (socketData.event === "video_capture_stopped") {
            if (this.$user.role !== "notary") {
              // this.waitingRoomChecklist.screenRecordingStarted = false;
            }
          }
          if (socketData.event === "new_page_added") {
            if (this.$user.role !== "notary" || this.joinedAsWitness) {
              this.addNewPage();
            }
          }
          if (socketData.event === "session_witness_removed") {
            if (socketData.removedUserId === String(this.$user._id)) {
              console.log("inside");
              this.witnessRemovedFromSessionShownToWitnessModal = true;
              setTimeout(() => {
                this.endVideoCall();
                this.$router.replace("/business");
                this.$q.notify({
                  message: "Witness Removed from Session. Thank you for joining in.",
                  color: "black"
                });
              }, 5000);
            }
          }
          if (socketData.event === "current_selected_document_changed") {
            if (socketData.userId !== String(this.$user._id) && socketData.currentSelectedDocumentId !== this.currentDocumentSelected._id) {
              this.currentDocumentSelected = this.allDocumentListKeyedById[socketData.currentSelectedDocumentId] || {};
              this.emptyPagesAdded = this.emptyPagesAddedDocIdWise[this.currentDocumentSelected._id] || 0;
              this.$q.notify({
                message: "Signing File Changed by Notary",
              });
            }
          }
          if (socketData.event === "custom_charges_modified") {
            if (socketData.userId !== String(this.$user._id)) {
              const {
                customChargesEditValues, customChargesModified
              } = socketData;
              console.log(socketData);
              this.customChargesEditValues = customChargesEditValues;
              this.customChargesModified = customChargesModified;
              this.allDroppedElements.push(false);
            }
          }
          if (socketData.event === "full_session_fields") {
            const { fullFields, emptyPagesAdded } = socketData;
            this.renderingSocketFields = true;
            _.map(this.allDroppedElements, (localFieldElement) => {
              console.log("close clicked", localFieldElement);
              this.deleteBox($(`#signature-element${localFieldElement.elementId}`), localFieldElement.elementId, false);
            });
            this.allDroppedElements = [];
            setTimeout(() => {
              if (emptyPagesAdded > this.emptyPagesAdded) {
                const totalExtraNewPages = emptyPagesAdded - this.emptyPagesAdded;
                for (let pagenum = 0; pagenum < totalExtraNewPages; pagenum += 1) {
                  this.totalPages += 1;
                  const currentPage = this.totalPages;
                  const pdfContainer = document.getElementById("pdf-pages-container");
                  const newCanvas = this.getNewCanvas(currentPage, this.firstPageViewPort);
                  $(newCanvas).css("background-color", "white");
                  const canvasContainer = this.getNewCanvasContainer(currentPage, "page");
                  canvasContainer.append(newCanvas);
                  pdfContainer.append(canvasContainer);
                }
                this.emptyPagesAdded = emptyPagesAdded;
              }
              setTimeout(() => {
                console.log("fullFields", fullFields);
                _.map(fullFields, (droppedElement) => {
                  this.createNewSignatureElement(droppedElement, false, true);
                });
              }, 1000);
            }, 2000);
          }
        }
      }
    });
    VueEventBus.$on("SOCKET_RECONNECTED", () => {
      this.socketRequest("join_session");
    });
    VueEventBus.$on("REMOVE_ELEMENT", (elementId) => {
      this.deleteBox($(`#signature-element${elementId}`), elementId, true);
    });
    this.socketRequest("join_session");
    setTimeout(() => {
      this.startVideoCall();
    }, 2000);
    window.onresize = _.debounce(this.resizeEvent, 100);
    if (!(this.pdfMode === "template" || this.sessionid === "simulator")) {
      if (this.videoCallSocketIntervalFunction) {
        clearInterval(this.videoCallSocketIntervalFunction);
      }
      this.videoCallSocketIntervalFunction = setInterval(() => {
        if (this.waitingRoomChecklist.allPartiesJoined && !this.waitingRoomChecklist.videoEnabledByAllParties) {
          if (!this.$refs.webrtc) {
            console.log("webrtc not defined 25s");
            return;
          }
          this.$refs.webrtc.leave();
          setTimeout(() => {
            this.$refs.webrtc.join();
          }, 4000);
        }
      }, 25000);
      if (this.videoCallSocketIntervalFunctionForNoConnectivity) {
        clearInterval(this.videoCallSocketIntervalFunctionForNoConnectivity);
      }
      this.videoCallSocketIntervalFunctionForNoConnectivity = setInterval(() => {
        if (!this.waitingRoomChecklist.allPartiesJoined && !this.waitingRoomChecklist.videoEnabledByAllParties) {
          if (!this.$refs.webrtc) {
            console.log("webrtc not defined 40s");
            return;
          }
          this.$refs.webrtc.leave();
          setTimeout(() => {
            this.$refs.webrtc.join();
          }, 4000);
        }
      }, 40000);
    }
    let extraChargesDocs = [];
    if (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.sessionType) {
      extraChargesDocs = this.sessionFullData.notaryUser.notaryCustomCharges[this.sessionFullData.newSessionModelData.sessionType] || [];
    } else {
      extraChargesDocs = this.sessionFullData.notaryUser.notaryCustomCharges.gnw || [];
    }
    this.customChargesEditValues = extraChargesDocs;
    const internetSpeed = await this.measureConnectionSpeed();
    console.log("internetSpeed", internetSpeed);
  },
  beforeDestroy() {
    if (window.stopCallback) {
      window.stopCallback("failure");
    }
    this.endVideoCall();
    this.socketRequest("leave_session");
    VueEventBus.$off("SOCKET_UPDATES");
    VueEventBus.$off("SOCKET_RECONNECTED");
    VueEventBus.$off("REMOVE_ELEMENT");
  },
  methods: {
    editCostOfNotarizationClicked() {
      this.editCostOfNotarizationModal = true;
    },
    addMoreChargesButton() {
      this.customChargesEditValues.push({
        id: `input${Math.floor(Math.random() * 999)}`,
        particular: "",
        amount: 0
      });
    },
    removeChargesButton(chargeId) {
      this.customChargesEditValues = _.filter(this.customChargesEditValues, (chargeDoc) => chargeDoc.id !== chargeId);
    },
    editCostOfNotarizationSaveClicked() {
      let customChargesValid = true;
      let totalCustomCharges = 0;
      _.map(this.customChargesEditValues, (customCharge) => {
        totalCustomCharges += parseFloat(customCharge.amount);
      });
      if (totalCustomCharges > 100) {
        customChargesValid = false;
      }
      if (!customChargesValid) {
        this.$q.notify({
          color: "danger",
          position: "bottom-right",
          message: "Custom Charges for Session cannot Exceed $100",
        });
        return;
      }
      const dataToSend = {
        sessionid: this.sessionid,
        user: this.$user._id,
        customChargesEditValues: this.customChargesEditValues,
        customChargesModified: this.customChargesModified
      };
      window.currentSocket.emit("custom_charges_modified", dataToSend, (res) => {
        console.log(res);
      });
      this.customChargesModified = true;
      this.allDroppedElements.push(false);
      this.editCostOfNotarizationModal = false;
    },
    recalculateDroppedElementsNextPreviousData() {
      console.log(this.$user.role);
      if (this.$user.role !== "customer") {
        return;
      }
      let customerTotalFields = 0;
      let customerTotalFieldsDataInserted = 0;
      const alreadyCounted = [];
      _.map(this.allDroppedElements, (droppedElement) => {
        if (droppedElement.fieldType === "placeholder") {
          // if (alreadyCounted.includes(droppedElement.elementId)) {
          //   return;
          // }
          // console.log(JSON.parse(JSON.stringify(droppedElement)));
          customerTotalFields += 1;
          if (droppedElement.imageData || droppedElement.inputTextValue) {
            customerTotalFieldsDataInserted += 1;
          }
          alreadyCounted.push(droppedElement.elementId);
        }
      });
      this.customerTotalFields = customerTotalFields;
      this.customerTotalFieldsDataInserted = customerTotalFieldsDataInserted;
      console.log(customerTotalFields, customerTotalFieldsDataInserted);
    },
    prevCustomerInput(event) {
      let currentHighlightedElementId = 0;
      let hightlightedValueFound = false;
      this.previousHighlightedElementId = this.currentHighlightedElementId;
      _.map(this.allDroppedElements, (droppedElement) => {
        if (hightlightedValueFound) {
          return;
        }
        if (droppedElement.fieldType === "placeholder") {
          if (!this.currentHighlightedElementId) {
            hightlightedValueFound = true;
          }
          if (this.currentHighlightedElementId === droppedElement.elementId) {
            hightlightedValueFound = true;
          } else {
            currentHighlightedElementId = droppedElement.elementId;
          }
        }
      });
      this.currentHighlightedElementId = currentHighlightedElementId;
      this.scrollToHighlightedDiv(event);
    },
    nextCustomerInput(event) {
      let currentHighlightedElementId = 0;
      let hightlightedValueFound = false;
      let hightlightedValueIsNextValue = false;
      this.previousHighlightedElementId = this.currentHighlightedElementId;
      _.map(this.allDroppedElements, (droppedElement) => {
        if (hightlightedValueFound) {
          return;
        }
        if (droppedElement.fieldType === "placeholder") {
          if (hightlightedValueIsNextValue) {
            hightlightedValueFound = true;
            hightlightedValueIsNextValue = false;
            currentHighlightedElementId = droppedElement.elementId;
            return;
          }
          if (!this.currentHighlightedElementId) {
            hightlightedValueFound = true;
            currentHighlightedElementId = droppedElement.elementId;
          } else if (this.currentHighlightedElementId === droppedElement.elementId) {
            hightlightedValueIsNextValue = true;
          }
        }
      });
      this.currentHighlightedElementId = currentHighlightedElementId;
      this.scrollToHighlightedDiv(event);
    },
    scrollToHighlightedDiv(event) {
      const divId = `signature-element${this.currentHighlightedElementId}`;
      event.preventDefault();
      const elementHeight = $(`#${divId}`).parent()[0].offsetTop + $(`#${divId}`)[0].offsetTop - 150;
      $("#pdf-pages-container").animate({ scrollTop: elementHeight }, 500);
      $(`#${divId}`).css("box-shadow", "-5px 10px 55px 4px rgba(0,0,0,0.75)");
      if (this.previousHighlightedElementId) {
        const oldDivId = `signature-element${this.previousHighlightedElementId}`;
        $(`#${oldDivId}`).css("box-shadow", "");
      }
    },
    droppableFieldClicked(event, droppableField) {
      if (this.isTouchDevice) {
        if (this.selectedDroppableField.name === droppableField.name) {
          this.selectedDroppableField = {};
        } else {
          this.selectedDroppableField = droppableField;
        }
      }
    },
    showInternetConnectionError() {
      if (this.internetConnectionSpeedTestErrorShown) {
        return;
      }
      this.$q.notify({
        message: "Your Internet Connection is slow. Move closer to wifi source to avoid poor performance.",
        color: "warning",
        textColor: "black",
        position: "center",
        actions: [
          { label: "Dismiss", color: "white", handler: () => { /* ... */ } }
        ],
        timeout: 40000
      });
      this.internetConnectionSpeedTestErrorShown = true;
    },
    async measureConnectionSpeed() {
      const imageAddr = "https://upload.wikimedia.org/wikipedia/commons/a/a6/Brandenburger_Tor_abends.jpg";
      const downloadSize = 2707459; // this must match with the image above
      setTimeout(() => {
        if (!this.internetConnectionSpeedTestDone) {
          console.log("Showing error for time over");
          this.showInternetConnectionError();
        }
      }, 25000);
      const startTime = (new Date()).getTime();
      const cacheBuster = `?nnn=${startTime}`;

      const download = new Image();
      download.src = imageAddr + cacheBuster;
      // this returns when the image is finished downloading
      await download.decode();
      const endTime = (new Date()).getTime();
      const duration = (endTime - startTime) / 1000;
      const bitsLoaded = downloadSize * 8;
      const speedBps = (bitsLoaded / duration).toFixed(2);
      const speedKbps = (speedBps / 1024).toFixed(2);
      const speedMbps = (speedKbps / 1024).toFixed(2);
      if (speedMbps < 1.5) {
        console.log("Showing error for speed slow", speedMbps);
        this.showInternetConnectionError();
      }
      this.internetConnectionSpeedTestDone = true;
      return Number(speedMbps);
    },
    sendFullSessionFields() {
      console.log("this.allDroppedElements", JSON.parse(JSON.stringify(this.allDroppedElements)));
      if (!this.allDroppedElements.length) {
        this.sendFullSessionFieldsIfDataFound = true;
        return;
      }
      if (!this.documentNagivationTimerEnabled) {
        return;
      }
      const dataToSend = {
        sessionid: this.sessionid,
        fullFields: this.allDroppedElements,
        emptyPagesAdded: this.emptyPagesAdded,
        user: this.$user._id,
        customChargesEditValues: this.customChargesEditValues,
        customChargesModified: this.customChargesModified
      };
      window.currentSocket.emit("full_session_fields", dataToSend, (res) => {
        console.log(res);
      });
    },
    getMeta(url, callback) {
      const img = new Image();
      img.src = url;
      img.onload = (omg) => {
        const imgObj = (omg && omg.path && omg.path[0]) || {};
        callback(imgObj.naturalWidth, imgObj.naturalHeight);
      };
    },
    async fetchSessionDoc() {
      console.log(this.sessionid);
      let roomNumberSessionId = this.sessionid;
      if (this.sessionid !== "simulator" && this.pdfMode !== "template") {
        let sessionFullData = false;
        let sessionUrl = `/session/fullSessionData/${this.sessionid}`;
        if (this.joinedAsWitness) {
          sessionUrl += "?witness=true";
        }
        try {
          sessionFullData = await Vue.axios.get(sessionUrl);
        } catch (error) {
          return false;
        }
        this.sessionFullData = sessionFullData.data;
      } else if (this.pdfMode === "template") {
        let templateDoc = false;
        try {
          templateDoc = await Vue.axios.post("/notary/templateFindOne", {
            templateId: this.sessionid
          });
        } catch (error) {
          console.log(error);
          return false;
        }
        console.log(templateDoc.data);
        this.sessionFullData = {
          newSessionModelData: false,
          originalDocument: (templateDoc && templateDoc.data && templateDoc.data.template) || {},
          notaryUser: this.$user || {},
          pdfDroppedElementDatas: (templateDoc && templateDoc.data && templateDoc.data.pdfDroppedElementDatas) || {},
          customerUser: false,
          notaryDatasDoc: (templateDoc && templateDoc.data && templateDoc.data.notaryDatasDoc) || {},
        };
      } else {
        roomNumberSessionId += Math.random().toString(36).slice(2);
        if (window.location.host === "localhost:8080") {
          this.sessionFullData = {
            newSessionModelData: false,
            notaryUser: {
                role: "notary",
                verified: true,
                memberType: "free",
                isSubscribed: true,
                _id: "62281d9e4c049b73f29c55e7",
                name: "Rohit Notary",
                email: "rohit@mailinator1.com",
                verification: "7f58313f-baf8-484b-9fe0-af48b25a034b",
                commissionNumber: "11111111",
                createdAt: "2022-03-09T03:23:10.537Z",
                updatedAt: "2022-04-10T08:15:01.738Z",
                state: "Colorado"
            },
            originalDocument: {
                _id: "6245ce0e64dbcfc5141df0a5",
                sessionid: "6245ca4964dbcfc5141deff3",
                documentCategory: "final_document",
                name: "Signed_Fixed-Rate-note-sample.pdf",
                url: "https://bluenotarybucket.s3.us-east-2.amazonaws.com/1648741900616blob",
                type: "application/pdf",
                size: "29829",
                key: "1648741900616blob",
                bucketName: "bluenotarybucket",
                uploadedBy: "62281d9e4c049b73f29c55e7",
                uploadedStage: "meet_notary_stage",
                createdAt: "2022-03-31T15:51:42.399Z",
                updatedAt: "2022-03-31T15:51:42.399Z"
            },
            pdfDroppedElementDatas: false,
            customerUser: {
                role: "customer",
                verified: true,
                memberType: "free",
                isSubscribed: true,
                _id: "6224ba9ef5473b2bd5e2681c",
                name: "Sample Signer",
                email: "sample@mailinator.com",
                verification: "944d0c9f-564e-4a6b-819e-58fce22673d6",
                createdAt: "2022-03-06T13:43:58.164Z",
                updatedAt: "2022-04-10T06:01:13.988Z"
            },
            notaryDatasDoc: {
                _id: "622af66cc9f7b0425ae0ccf3",
                commissionExpiresOn: 1836498600,
                county: "INDIA",
                dcpassword: "123456",
                userId: "62281d9e4c049b73f29c55e7",
                email: "rohit@mailinator1.com",
                createdAt: "2022-03-11T07:12:44.829Z",
                updatedAt: "2022-04-12T04:38:27.708Z",
                sealdata: "https://bluenotarybucket.s3.us-east-2.amazonaws.com/1648749418987photonlegal.png",
                sealfilename: "photonlegal.png",
                notaryCertificates: [
                    {
                        _id: "624f0f2d2f1f56bad95366fe",
                        name: "IMG_0467-min.jpg",
                        url: "https://bluenotarybucket.s3.us-east-2.amazonaws.com/1649348388134IMG_0467-min.jpg",
                        key: "1649348388134IMG_0467-min.jpg"
                    },
                    {
                        _id: "624f0f812f1f56bad9536719",
                        name: "Screenshot 2022-04-03 at 1.00.25 PM.png",
                        url: "https://bluenotarybucket.s3.us-east-2.amazonaws.com/1649348478445Screenshot%202022-04-03%20at%201.00.25%20PM.png",
                        key: "1649348478445Screenshot 2022-04-03 at 1.00.25 PM.png"
                    }
                ]
            }
          };
        } else {
          this.sessionFullData = {
            newSessionModelData: false,
            notaryUser: {
                role: "notary",
                verified: true,
                memberType: "free",
                isSubscribed: true,
                _id: "6241dc4597fb2a95efdb5dfb",
                name: "Blue Notary User",
                email: "rohnotary@mailinator.com",
                verification: "b3fbae59-132c-48b2-bf00-dba8fb1d0776",
                commissionNumber: "2334234234",
                approve: "active",
                createdAt: "2022-03-28T16:03:17.750Z",
                updatedAt: "2022-03-28T16:03:17.750Z"
            },
            originalDocument: {
                _id: "625ef5f8839f578b0b9d4e60",
                sessionid: "624833a85141ab04541d23f5",
                documentCategory: "initial_document",
                name: "Deed-of-Trust.pdf",
                url: "https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/1650390519829Deed-of-Trust.pdf",
                type: "application/pdf",
                size: "83714",
                key: "1650390519829Deed-of-Trust.pdf",
                bucketName: "bluenotarybuckey2",
                uploadedBy: "6241dd0797fb2a95efdb5e23",
                uploadedStage: "identity_check_stage",
                createdAt: "2022-04-19T17:48:40.014Z",
                updatedAt: "2022-04-19T17:48:45.656Z"
            },
            pdfDroppedElementDatas: false,
            customerUser: {
                role: "customer",
                verified: true,
                memberType: "free",
                isSubscribed: true,
                _id: "6241dd0797fb2a95efdb5e23",
                name: "Sample Signer",
                email: "sample@mailinator.com",
                verification: "6875c02a-7b85-49f4-8829-f8d81f446f4b",
                commissionNumber: "",
                createdAt: "2022-03-28T16:06:31.148Z",
                updatedAt: "2022-03-30T04:52:08.008Z"
            },
            notaryDatasDoc: {
                _id: "6241dce097fb2a95efdb5e13",
                sealdata: "https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/1648522958437eseal-example.jpg",
                sealfilename: "eseal-example.jpg",
                userId: "6241dc4597fb2a95efdb5dfb",
                email: "rohnotary@mailinator.com",
                notaryCertificates: [
                  {
                    _id: "625ef6fa839f578b0b9d4eb9",
                    name: "notary-certificate-sample.png",
                    url: "https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/1650390778616notary-certificate-sample.png",
                    key: "1650390778616notary-certificate-sample.png"
                  }
                ],
                createdAt: "2022-03-28T16:05:52.127Z",
                updatedAt: "2022-04-18T18:18:10.300Z",
                commissionExpiresOn: 1648665000,
                county: "3424324",
                dcpassword: "234567"
            }
          };
        }
        const url = "notary/loads";
        const response = await Vue.axios.post(url, {
          dontGetStripe: true
        }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response && response.data && response.data.sealdata) {
          this.sessionFullData.notaryDatasDoc.sealdata = response.data.sealdata;
        }
        if (response && response.data && response.data.notaryCertificates) {
          this.sessionFullData.notaryDatasDoc.notaryCertificates = response.data.notaryCertificates;
        }
      }
      console.log(this.sessionFullData);
      if (this.sessionFullData && !this.sessionFullData.allDocumentDocs) {
        this.sessionFullData.allDocumentDocs = [this.sessionFullData.originalDocument];
      }
      this.allDocumentList = this.sessionFullData.allDocumentDocs;
      this.allDocumentListKeyedById = _.keyBy(this.allDocumentList, "_id");
      this.currentDocumentSelected = this.allDocumentList[0];
      if (this.sessionFullData && this.sessionFullData.notaryDatasDoc && this.sessionFullData.notaryDatasDoc.sealdata) {
        this.allImagesData.notarySealImage = this.sessionFullData.notaryDatasDoc.sealdata;
      }
      this.videoCallRoomNumber = `bnSession${roomNumberSessionId}`;
      this.notorizationType = (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.notorizationType) ? [this.sessionFullData.newSessionModelData.notorizationType] : [];
      this.emptyPagesAdded = (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.emptyPagesAdded) || 0;
      this.emptyPagesAddedDocIdWise = (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.emptyPagesAddedDocIdWise) || {};
      this.maxWitnessJoined = (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.maxWitnessJoined) || 0;
      this.attachCertificate = (this.sessionFullData && this.sessionFullData.newSessionModelData && this.sessionFullData.newSessionModelData.attachCertificate) || false;
      this.allNotaryCertificates = (this.sessionFullData && this.sessionFullData.notaryDatasDoc && this.sessionFullData.notaryDatasDoc.notaryCertificates) || [];
      this.multiSignerUserDocs = (this.sessionFullData && this.sessionFullData.multiSignerUserDocs) || [];
      this.allDroppedElementsDocIdWise = (this.sessionFullData && this.sessionFullData.pdfDroppedElementDatas && this.sessionFullData.pdfDroppedElementDatas.droppedElementsDocIdWise) || {};
      if (this.sessionFullData && this.sessionFullData.pdfDroppedElementDatas) {
        this.sessionFullData.pdfDroppedElementDatas.droppedElements = _.map(this.sessionFullData.pdfDroppedElementDatas.droppedElements || [], (droppedElement) => {
          if (droppedElement.text === "Signer's Full Name") {
            droppedElement.text = (this.sessionFullData && this.sessionFullData.customerUser && this.sessionFullData.customerUser.name) || "Signer's Full Name";
          }
          return droppedElement;
        });
      }
      if (this.allDroppedElementsDocIdWise) {
        _.map(this.allDroppedElementsDocIdWise, (droppedElements, tempDocumentId) => {
          const tempDroppedElements = _.map(droppedElements, (droppedElement) => {
            if (droppedElement.text === "Signer's Full Name") {
              droppedElement.text = (this.sessionFullData && this.sessionFullData.customerUser && this.sessionFullData.customerUser.name) || "Signer's Full Name";
            }
            return droppedElement;
          });
          this.allDroppedElementsDocIdWise[tempDocumentId] = tempDroppedElements;
        });
      }
      // console.log(this.sessionFullData);
      // console.log("this.allDroppedElementsDocIdWise", this.allDroppedElementsDocIdWise);
      // (this.sessionFullData && this.sessionFullData.customerUser && this.sessionFullData.customerUser.name)
      _.map(this.allDocumentList, (tempDocumentDoc) => {
        if (!this.allDroppedElementsDocIdWise[tempDocumentDoc._id]) {
          Vue.set(this.allDroppedElementsDocIdWise, tempDocumentDoc._id, []);
        }
        if (!this.emptyPagesAddedDocIdWise[tempDocumentDoc._id]) {
          Vue.set(this.emptyPagesAddedDocIdWise, tempDocumentDoc._id, 0);
        }
      });
      if (this.allImagesData.notarySealImage) {
        this.getMeta(
          this.allImagesData.notarySealImage,
          (width, height) => {
            if (width && height) {
              this.signatureFields = _.map(this.signatureFields, (singatureField) => {
                if (singatureField.image_field_type === "notary_seal") {
                  const aspectRatio = width / height;
                  singatureField.width = `${100 * aspectRatio}px`;
                }
                return singatureField;
              });
            }
          }
        );
      }
      // console.log(this.allNotaryCertificates);
      // _.map(this.allNotaryCertificates, (notaryCertificate) => {
      //   this.getMeta(
      //     notaryCertificate.url,
      //     (width, height) => {
      //       if (width && height) {
      //         const aspectRatio = width / height;
      //         notaryCertificate.width = 400 * aspectRatio;
      //         notaryCertificate.height = 400;
      //       }
      //     }
      //   );
      // });
      return true;
    },
    async getSessionWitnessDetails() {
      if (this.pdfMode === "template" || this.sessionid === "simulator") {
        return;
      }
      const sessionWitnessUrl = `/session/getAllSessionWitnesses/${this.sessionid}`;
      let sessionFullData = false;
      try {
        sessionFullData = await Vue.axios.get(sessionWitnessUrl);
      } catch (error) {}
      const currentSessionWitnessUsers = (sessionFullData && sessionFullData.data && sessionFullData.data.sessionWitnesses) || [];
      this.currentSessionWitnessUsers = _.map(currentSessionWitnessUsers, (witnessUserDoc) => {
        if (witnessUserDoc.userid && _.includes(this.currentPageUsers, witnessUserDoc.userid)) {
          witnessUserDoc.userActive = true;
        } else {
          witnessUserDoc.userActive = false;
        }
        return witnessUserDoc;
      });
    },
    witnessRemoveClicked(sessionWitnessDoc) {
      console.log("sessionWitnessDoc", sessionWitnessDoc);
      this.witnessDeleteConfirmationModal = true;
      this.witnessDeleteDoc = sessionWitnessDoc;
    },
    async witnessRemoveDialogClicked() {
      console.log(this.witnessDeleteDoc);
      const saveUrl = "session/removeSessionWitness";
      const dataToSave = {
        sessionid: this.sessionid,
        sessionwitnessid: this.witnessDeleteDoc._id
      };
      const response = await this.axios.post(saveUrl, dataToSave, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      this.$q.notify({
        color: "primary",
        position: "bottom-right",
        message: "Witness Removed Successfully from session",
      });
      this.socketRequest("session_witness_removed", {
        removedUserId: this.witnessDeleteDoc.userid
      });
      this.socketRequest("session_witness_management_changed");
      this.getSessionWitnessDetails();
    },
    captureCamera(cb) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(cb);
    },
    startVideoRecording() {
      if (this.pdfMode === "template" || this.sessionid === "simulator") {
        return;
      }
      this.captureCamera((camera) => {
        const mediaRecorder = new MediaRecorder(camera, {
          mimeType: "video/webm",
          frameInterval: 10,
          videoBitsPerSecond: 64000,
        });
        mediaRecorder.ondataavailable = (e) => {
          console.log("ondataavailable called", e.data);
          const dataToSend = {
            sessionid: this.sessionid,
            user: this.$user._id,
            blob: e.data
          };
          if (window.currentSocket) {
            window.currentSocket.emit("pdf_video_session_stream", dataToSend, (res) => {
              console.log("res", res);
            });
          }
        };
        // event : new recorded video blob available
        // mediaRecorder.addEventListener("dataavailable", (e) => {
        //   console.log("dataavailable called", e.data);
        //   const dataToSend = {
        //     sessionid: this.sessionid,
        //     user: this.$user._id,
        //     blob: e.data
        //   };
        //   if (window.currentSocket) {
        //     window.currentSocket.emit("pdf_video_session_stream", dataToSend, (res) => {
        //       console.log("res", res);
        //     });
        //   }
        // });
        // mediaRecorder.addEventListener("ondataavailable", (e) => {
        //   console.log("ondataavailable called", e.data);
        //   const dataToSend = {
        //     sessionid: this.sessionid,
        //     user: this.$user._id,
        //     blob: e.data
        //   };
        //   if (window.currentSocket) {
        //     window.currentSocket.emit("pdf_video_session_stream", dataToSend, (res) => {
        //       console.log("res", res);
        //     });
        //   }
        // });

        // mediaRecorder.start(50000);
        // mediaRecorder.stop();
        // mediaRecorder.stop();
        // start recording with each recorded blob having 5 second video
        mediaRecorder.start(5000);
        console.log(mediaRecorder);
        // setInterval(() => {
        //   console.log(mediaRecorder);
        //   // mediaRecorder.requestData();
        //   mediaRecorder.stop();
        //   mediaRecorder.start();
        // }, "5000");
        window.stopCallback = async (outputStatus, firstDocument, lastDocument, originalDocumentId) => {
          console.log("firstDocument", firstDocument);
          console.log("lastDocument", lastDocument);
          if (lastDocument) {
            window.stopCallback = null;
            mediaRecorder.stop();
          }
          if (outputStatus === "success") {
            const documentSaveUrl = `file/pdfEditsFinalDocumentSave/${this.sessionid}`;
            const formData2 = new FormData();
            formData2.append("filename", `Signed_${this.sessionFullData.originalDocument.name}`);
            formData2.append("lastDocument", lastDocument);
            formData2.append("originalDocumentId", originalDocumentId);
            formData2.append("file", this.outputFileObject);
            this.completePDFLoadingDetails.progress = 0.8;
            this.completePDFLoadingDetails.progressText = "Saving Final PDF Document";

            const documentSaveResponse = await this.axios.post(documentSaveUrl, formData2, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
            let paymentFailed = false;
            let paymentDone;
            if (lastDocument) {
              paymentDone = "failure";
              if (documentSaveResponse && documentSaveResponse.data && documentSaveResponse.data.paymentDone === "success") {
                paymentDone = "success";
                this.socketRequest("session_completed");
              } else {
                paymentFailed = true;
                this.socketRequest("session_completed_payment_failed");
              }
            }
            if (lastDocument) {
              this.completePDFLoadingDetails.progress = 1;
              this.completePDFLoadingDetails.progressText = "All Done";
              if (paymentFailed) {
                this.completePDFLoadingDetails.progressText += " (But Payment Failed from Customer's end. Prompting Customer to Re-enter Payment Details)";
              }
              try {
                const videoSaveUrl = `file/pdfEditsVideoDocumentSave/${this.sessionid}`;
                this.axios.post(videoSaveUrl, {}, {});
              } catch (error) {
                console.log(error);
              }
              setTimeout(() => {
                this.endVideoCall();
                this.completePDFLoadingModal = false;
                this.$router.replace(`/notary/my-sessions?confirmationSession=${this.sessionid}&paymentDone=${paymentDone}`);
              }, 7000);
            }
          }
        };
      });
    },
    resizeEvent(e) {
      if (e.target.self === window) {
        let fieldIndex = 0;
        _.map(this.allDroppedElements, (localDroppedElement) => {
          if (!localDroppedElement) {
            return;
          }
          this.deleteBox($(`#signature-element${localDroppedElement.elementId}`), localDroppedElement.elementId, false);
          this.createNewSignatureElement(localDroppedElement, fieldIndex, true);
          fieldIndex += 1;
        });
      }
    },
    async checkUserDetails() {
      this.showCheckUserDetailsModal = true;
      this.checkUserDetailsModalLoading = true;
      if (this.pdfMode === "template" || this.sessionid === "simulator") {
        this.userDetailsModalFrontImageUrl = "https://bluenotary.us/assets/img/sample-id-front.png";
        this.checkUserDetailsModalLoading = false;
        return;
      }
      const userFullDetails = await Vue.axios.get(`/session/getCustomerDetailsAfterChecking/${this.sessionid}`);
      this.checkUserDetailsModalLoading = false;
      console.log(userFullDetails);
      this.userDetailsModalDataRows = (userFullDetails && userFullDetails.data && userFullDetails.data.allDetail) || [];
      this.userDetailsModalFrontImageUrl = (userFullDetails && userFullDetails.data && userFullDetails.data.frontPhotoUrl) || false;
      this.userDetailsModalBackImageUrl = (userFullDetails && userFullDetails.data && userFullDetails.data.backPhotoUrl) || false;
      this.userDetailsModalResponse = (userFullDetails && userFullDetails.data) || {};
      console.log(this.userDetailsModalDataRows);
      console.log(this.userDetailsModalDataRows.length);
      // console.log(this.multiSignerUserDocs);
    },
    closeUserDetailsModal() {
      this.showCheckUserDetailsModal = false;
    },
    closeCustomerThankyouModal() {
      this.endVideoCall();
      this.$router.replace(`/business?confirmationSession=${this.sessionid}`);
    },
    terminateClicked() {
      if (this.sessionid === "simulator") {
        this.endVideoCall();
        this.socketRequest("session_terminated");
        this.$router.replace("/notary/dashboard");
      } else {
        this.$q.dialog({
          title: "Confirm",
          message: "Are you sure you want to terminate this Session?",
          cancel: true,
          persistent: true
        }).onOk(() => {
          this.endVideoCall();
          this.socketRequest("session_terminated");
          this.$router.replace("/notary/my-sessions");
          this.$q.notify({
            message: "Session Terminated Successfully.",
            color: "black"
          });
        });
      }
    },
    startVideoCall() {
      if (this.$refs.webrtc) {
        this.$refs.webrtc.join();
        setTimeout(() => {
          _.map($("video"), ((videoElement) => {
            videoElement.controls = "";
          }));
        }, 3000);
        this.videoCallStarted = true;
        this.$watch(
          () => this.$refs.webrtc.videoList,
          (value) => {
          if (value && value.length >= 2) {
            this.waitingRoomChecklist.videoEnabledByAllParties = true;
            this.waitingRoomChecklist.allPartiesJoined = true; // Temp thing
          } else {
            this.waitingRoomChecklist.videoEnabledByAllParties = false;
          }
        }
      );
      } else {
        setTimeout(this.startVideoCall, 2000);
      }
    },
    endVideoCall() {
      if (this.$refs.webrtc) {
        try {
          this.$refs.webrtc.leave();
        } catch (error) {
          console.log("error1", error);
        }
      }
    },
    logEvent(event) {
      console.log("Event : ", event);
      setTimeout(() => {
        _.map($("video"), ((videoElement) => {
          videoElement.controls = "";
        }));
      }, 3000);
    },
    socketRequest(eventName, extraDataToSend) {
      const dataToSend = {
        sessionid: this.sessionid,
        user: this.$user._id
      };
      if (extraDataToSend) {
        Object.assign(dataToSend, extraDataToSend);
      }
      if (window.currentSocket) {
        window.currentSocket.emit(eventName, dataToSend, (res) => {
          console.log("res", res);
        });
      }
    },
    sendSocketChangeRequest(updatedElement) {
      if (!updatedElement) {
        return;
      }
      const dataToSend = {
        sessionid: this.sessionid,
        updatedField: updatedElement,
        user: this.$user._id
      };
      window.currentSocket.emit("dropped_field_updates", dataToSend, (res) => {
        console.log(res);
      });
    },
    pageclick(event) {
      if (this.isTouchDevice && this.selectedDroppableField.name) {
        this.finishDrop(event, this.selectedDroppableField);
        this.selectedDroppableField = {};
      }
    },
    getNewCanvas (page, viewport) {
      const newCanvas = document.createElement("canvas");
      newCanvas.setAttribute("class", "pdf-page");
      newCanvas.setAttribute("id", page);
      newCanvas.height = Math.floor(viewport.height);
      newCanvas.width = Math.floor(viewport.width);
      return newCanvas;
    },

    deleteBox (signatureElement, elementId, doSocketCall) {
      signatureElement.remove();
      this.allDroppedElements = _.map(this.allDroppedElements, (droppedElement) => {
        if (droppedElement.elementId === elementId) {
          const dataToSend = {
            elementId,
            removed: true
          };
          if (doSocketCall) {
            this.sendSocketChangeRequest(dataToSend);
          }
          return false;
        }
        return droppedElement;
      });
    },

    selectionDoneFunction(droppedFieldIndex, dataToSave, elementId) {
      console.log(droppedFieldIndex, dataToSave, JSON.parse(JSON.stringify(this.allDroppedElements)), elementId);
      console.log(elementId);
      if (dataToSave) {
        let indexToUse = -1;
        let currentIndex = 0;
        _.map(this.allDroppedElements, (tempDroppedField) => {
          if (tempDroppedField.elementId === elementId) {
            indexToUse = currentIndex;
          }
          currentIndex += 1;
        });
        Object.assign(this.allDroppedElements[indexToUse], dataToSave);
        console.log(this.allDroppedElements[indexToUse]);
        this.sendSocketChangeRequest(this.allDroppedElements[indexToUse]);
      }
    },

    createNewSignatureElement(droppedElement, indexToInsert, dontSendSocketUpdates) {
      if (!droppedElement) {
        return {};
      }
      const {
        page, text, fieldType, fieldPlaceholderType, fieldHeight, fieldWidth, x, y, inputTextValue, imageData, screenX, screenY, imageFieldType
      } = droppedElement;
      // console.log(droppedElement);
      let {
        elementId
      } = droppedElement;

      let firstTimeRender = false;
      if (!elementId) {
        elementId = (Math.random() + 1).toString(36).substring(5);
        firstTimeRender = true;
      }
      // let incrementId = false;
      const pageContainer = document.getElementById(`page${page}`);
      const pageBounds = $(pageContainer).children(0)[0].getBoundingClientRect();
      const pageContainerBounds = $(pageContainer)[0].getBoundingClientRect();
      const vm = this;
      const newElement = document.createElement("div");
      let finalHeight = `${vm.signatureHeight}px`;
      if (fieldHeight) {
        finalHeight = fieldHeight;
      }
      let finalWidth = `${vm.signatureWidth}px`;
      if (fieldWidth) {
        finalWidth = fieldWidth;
      }
      const finalScreenX = x + pageBounds.left - pageContainerBounds.left;
      newElement.setAttribute("class", "signature-element dropdown");
      newElement.setAttribute("id", `signature-element${elementId}`);
      newElement.style.height = finalHeight;
      newElement.style.width = finalWidth;
      newElement.style.position = "absolute";
      newElement.style.top = `${y}px`;
      newElement.style.fontSize = "15px";
      newElement.style.left = `${finalScreenX}px`;
      newElement.style["border-radius"] = "10px";
      if (fieldType === "input_text") {
        // newElement.style.border = "1px solid black";
      } else {
        newElement.style.border = "1px solid #d5ded7";
      }

      const tempDiv = document.createElement("div");
      tempDiv.setAttribute("id", `field_child_${elementId}`);
      tempDiv.style.height = "100%";
      tempDiv.style.width = "100%";
      newElement.prepend(tempDiv);
      const objectToInsert = {
          screenX,
          screenY,
          x,
          y,
          size: 13,
          color: "black",
          text,
          page,
          fieldType,
          fieldPlaceholderType,
          fieldHeight,
          fieldWidth,
          firstTimeRender,
          inputTextValue,
          elementId,
          imageData,
          imageFieldType,
          droppedBy: droppedElement.droppedBy || this.$user._id
      };
      if (!(objectToInsert.fieldType === "signature" || objectToInsert.fieldType === "notary_certificate" || objectToInsert.fieldPlaceholderType === "signature")) {
        objectToInsert.imageData = "";
      }
      if (indexToInsert === false) {
        this.allDroppedElements.push(objectToInsert);
        indexToInsert = this.allDroppedElements.length - 1;
        // incrementId = true;
      } else {
        this.allDroppedElements.splice(indexToInsert, 0, objectToInsert);
      }

      let canEditElement = this.$user.role === "notary" || String(objectToInsert.droppedBy) === String(this.$user._id);
      if (this.joinedAsWitness) {
        canEditElement = false;
      }
      if (canEditElement) {
        const closeButton = document.createElement("button");
        closeButton.setAttribute("class", "delete");
        closeButton.style.float = "right";
        closeButton.style.top = "-15px";
        closeButton.style.left = "-15px";
        closeButton.style.position = "absolute";
        closeButton.innerHTML = "x";
        newElement.append(closeButton);
        closeButton.addEventListener("click", (e) => {
          e.stopPropagation();
          vm.deleteBox(newElement, elementId, true);
        });
      }
      pageContainer.append(newElement);
      if (canEditElement) {
        if (["checkmark", "static_text"].indexOf(fieldType) === -1) {
          $(`#signature-element${elementId}`).resizable({
            stop: (event, ui) => {
              console.log(event, ui);
              const finalSize = ui.size;
              this.allDroppedElements = _.map(this.allDroppedElements, (localDroppedElement) => {
                if (localDroppedElement.elementId === elementId) {
                  const deltaWidth = finalSize.width - ui.originalSize.width;
                  const deltaHeight = finalSize.height - ui.originalSize.height;
                  console.log(deltaWidth, deltaHeight);
                  console.log(JSON.parse(JSON.stringify(localDroppedElement)));
                  localDroppedElement.fieldHeight = `${finalSize.height}px`;
                  localDroppedElement.fieldWidth = `${finalSize.width}px`;
                  // localDroppedElement.x += (deltaWidth / 2);
                  // localDroppedElement.y -= (deltaHeight / 2);
                  console.log(JSON.parse(JSON.stringify(localDroppedElement)));
                  this.sendSocketChangeRequest(localDroppedElement);
                }
                return localDroppedElement;
              });
            }
          });
        }
        $(`#signature-element${elementId}`).draggable({
          stop: (event, ui) => {
            console.log(event, ui);
            const pdfPageBounds = event.target.parentNode.children[0].getBoundingClientRect();
            const finalX = ui.offset.left;
            // const finalX = ui.position.left;
            const finalY = ui.position.top;
            console.log(finalY);
            this.allDroppedElements = _.map(this.allDroppedElements, (localDroppedElement) => {
              if (localDroppedElement.elementId === elementId) {
                localDroppedElement.screenX = finalX;
                localDroppedElement.screenY = finalY + 116;
                const positionWrtPageX = Math.round(finalX - pdfPageBounds.x);
                localDroppedElement.x = positionWrtPageX;
                localDroppedElement.y = finalY;
                console.log(finalX, pdfPageBounds.x, positionWrtPageX);
                console.log(localDroppedElement);
                this.sendSocketChangeRequest(localDroppedElement);
              }
              return localDroppedElement;
            });
          }
        });
      }
      const MyWidget = Vue.extend(DroppedFieldComponent);
      const mounted = new MyWidget({
        parent: this,
        propsData: {
          fieldType,
          fieldText: text,
          fieldDroppedIndex: indexToInsert,
          fieldPlaceholderType,
          selectedFieldIndex: this.allDroppedElements.length - 1,
          selectionDoneFunction: this.selectionDoneFunction,
          firstTimeRender,
          inputTextValueToPass: inputTextValue,
          imageData,
          elementId,
          imageFieldType,
          allImagesData: this.allImagesData,
          allNotaryCertificates: this.allNotaryCertificates
        }
      }).$mount(document.getElementById(`field_child_${elementId}`));
      this.allDroppedElementsVueComponents[elementId] = mounted;
      // if (incrementId) {
      //   elementId += 1;
      // }
      if (!dontSendSocketUpdates) {
        this.sendSocketChangeRequest(this.allDroppedElements[this.allDroppedElements.length - 1]);
      }
      return {
        newElement,
        recipientEmail: vm.selectedRecipientEmail,
      };
    },

    dropOnPdf (event) {
      event.preventDefault();
      event.stopPropagation();
    },

    startDrag(event, field, name, type, placeholderType, textToInsert, height, width) {
      event.dataTransfer.setData("field", field);
      event.dataTransfer.setData("name", name);
      event.dataTransfer.setData("type", type);
      event.dataTransfer.setData("placeholder_type", placeholderType);
      event.dataTransfer.setData("text_to_insert", textToInsert);
      if (height) {
        event.dataTransfer.setData("height", height);
      }
      if (width) {
        event.dataTransfer.setData("width", width);
      }
      this.realDragStarted = true;
    },

    async addNewPage() {
      if (this.$user.role === "notary" && !this.joinedAsWitness) {
        this.$q.dialog({
          title: "Confirm",
          message: "Are you sure you want to add a new blank page at bottom of the pdf?",
          cancel: true,
          persistent: true
        }).onOk(() => {
          this.totalPages += 1;
          this.emptyPagesAdded += 1;
          const currentPage = this.totalPages;
          const pdfContainer = document.getElementById("pdf-pages-container");
          const newCanvas = this.getNewCanvas(currentPage, this.firstPageViewPort);
          $(newCanvas).css("background-color", "white");
          const canvasContainer = this.getNewCanvasContainer(currentPage, "page");
          canvasContainer.append(newCanvas);
          pdfContainer.append(canvasContainer);
          this.$q.notify({
            message: "New Blank Page Added",
            color: "black"
          });
          this.socketRequest("new_page_added");
        });
      } else {
        this.totalPages += 1;
        this.emptyPagesAdded += 1;
        const currentPage = this.totalPages;
        const pdfContainer = document.getElementById("pdf-pages-container");
        const newCanvas = this.getNewCanvas(currentPage, this.firstPageViewPort);
        $(newCanvas).css("background-color", "white");
        const canvasContainer = this.getNewCanvasContainer(currentPage, "page");
        canvasContainer.append(newCanvas);
        pdfContainer.append(canvasContainer);
      }
    },

    finishDrop (event, droppedFieldViaClick) {
      event.preventDefault();
      event.stopPropagation();
      if (!this.realDragStarted && !droppedFieldViaClick) {
        return;
      }
      this.realDragStarted = false;
      const vm = this;
      let fieldDoc = (droppedFieldViaClick && JSON.stringify(droppedFieldViaClick)) || event.dataTransfer.getData("field");
      try {
        fieldDoc = JSON.parse(fieldDoc);
      } catch (error) {
        console.log(error);
      }
      console.log(fieldDoc);
      let fieldName;
      let fieldType;
      let fieldPlaceholderType;
      let fieldTextToInsert;
      let fieldHeight;
      let fieldWidth;
      if (droppedFieldViaClick && droppedFieldViaClick.name) {
        fieldName = droppedFieldViaClick.textToInsert || droppedFieldViaClick.name;
        fieldType = droppedFieldViaClick.type;
        fieldPlaceholderType = droppedFieldViaClick.placeholder_type;
        fieldTextToInsert = droppedFieldViaClick.textToInsert;
        fieldHeight = droppedFieldViaClick.height;
        fieldWidth = droppedFieldViaClick.width;
      } else {
        fieldName = event.dataTransfer.getData("name");
        fieldType = event.dataTransfer.getData("type");
        fieldPlaceholderType = event.dataTransfer.getData("placeholder_type");
        fieldTextToInsert = event.dataTransfer.getData("text_to_insert");
        fieldHeight = event.dataTransfer.getData("height");
        fieldWidth = event.dataTransfer.getData("width");
      }
      const targetPosition = event.target.getBoundingClientRect();
      const imageFieldType = fieldDoc.image_field_type || "";
      // check if the dropped element lies inside the page boundaries
      if (!(droppedFieldViaClick && droppedFieldViaClick.name)) {
        if (!(
          targetPosition.top < (event.clientY - (vm.signatureHeight / 2)) &&
          targetPosition.bottom > (event.clientY + (vm.signatureHeight / 2)) &&
          targetPosition.left < (event.clientX - (vm.signatureWidth / 2)) &&
          targetPosition.right > (event.clientX + (vm.signatureWidth / 2))
        )) {
          this.$toast.error("Element not inside page boundary", 2000);
          return;
        }
      }
      let positionWrtPageX = Math.round(event.clientX - targetPosition.x);
      let positionWrtPageY = Math.round(event.clientY - targetPosition.y);
      let text = fieldName;
      if (fieldTextToInsert !== "undefined" && !fieldTextToInsert && typeof fieldTextToInsert !== "undefined") {
        text = fieldTextToInsert;
      }
      let eventTargetId = event.target.id;
      try {
        let { parentNode } = event.target;
        if (!$(parentNode).siblings("canvas")[0]) {
          parentNode = $(parentNode)[0].parentNode;
        }
        if (Number.isNaN(parseInt(eventTargetId))) {
          eventTargetId = $(parentNode).siblings("canvas")[0].id;
          const parentId = parentNode.id;
          const parentElementId = parentId.replace("signature-element", "");
          _.map(this.allDroppedElements, (localDroppedElement) => {
            if (localDroppedElement.elementId === parentElementId) {
              positionWrtPageX += localDroppedElement.x;
              positionWrtPageY += localDroppedElement.y;
            }
          });
        }
      } catch (error) {
        console.log(error);
      }
      const dataToSend = {
        page: eventTargetId,
        text,
        fieldType,
        fieldPlaceholderType,
        fieldHeight,
        fieldWidth,
        screenX: event.clientX,
        screenY: event.clientY,
        x: positionWrtPageX,
        y: positionWrtPageY,
        elementId: false,
        inputTextValue: "",
        imageFieldType
      };
      const signatureElementData = vm.createNewSignatureElement(dataToSend, false);
      console.log(signatureElementData);
    },

    getNewCanvasContainer (pageNo, prefix) {
      const vm = this;
      const canvasContainer = document.createElement("div");
      canvasContainer.id = prefix + pageNo;
      canvasContainer.style.position = "relative";
      canvasContainer.style.fontSize = "0";
      canvasContainer.style.marginBottom = "1rem";
      canvasContainer.style.marginRight = "0.5rem";
      canvasContainer.style.border = "1px solid #d6d6d6";
      canvasContainer.addEventListener("dragover", vm.dropOnPdf);
      canvasContainer.addEventListener("drop", vm.finishDrop);
      return canvasContainer;
    },

    getPageTag (pageNo) {
      const pageTag = document.createElement("p");
      pageTag.style.position = "absolute";
      pageTag.style.top = "0";
      pageTag.style.left = "0";
      pageTag.style.fontSize = "15px";
      pageTag.style.background = "#75b5ea";
      pageTag.style.padding = "0 7px";
      pageTag.style.color = "#fff";
      pageTag.style.fontWeight = "700";
      pageTag.innerHTML = pageNo;
      return pageTag;
    },

    isValidHttpUrl(string) {
      let url;
      try {
        url = new URL(string);
      } catch (e) {
        return false;
      }
      return url.protocol === "http:" || url.protocol === "https:";
    },
    arrayToBase64String(tempArray) {
      return btoa(String.fromCharCode(...tempArray));
    },
    async downscaleImage(dataUrl, imageType, imageArguments) {
      // Provide default values
      imageType = imageType || "image/jpeg";
      imageArguments = imageArguments || 0.5;

      // Create a temporary image so that we can compute the height of the downscaled image.
      const image = new Image();
      image.src = `https://cors-fix.web.app/v1?url=${dataUrl}`;
      image.crossOrigin = "anonymous";

      await image.decode();
      console.log(image.height);

      // Create a temporary canvas to draw the downscaled image on.
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      // Draw the downscaled image on the canvas and return the new data URL.
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, image.width, image.height);
      console.log(canvas);
      const newDataUrl = canvas.toDataURL(imageType, imageArguments);
      return newDataUrl;
    },
    async completePDF() {
      this.$q.dialog({
        title: "Confirm",
        message: "Are you sure you want to complete this Session?",
        cancel: true,
        persistent: true
      }).onOk(async () => {
        /* eslint-disable no-await-in-loop */
        this.completePDFLoadingModal = true;
        const finalAllDroppedElementsDocIdWise = {};
        _.map(this.allDroppedElementsDocIdWise, (tempAllDroppedElements, docId) => {
          finalAllDroppedElementsDocIdWise[docId] = _.uniqBy(_.compact(tempAllDroppedElements), "elementId");
        });
        for (let documentIndex = 0; documentIndex < this.allDocumentList.length; documentIndex += 1) {
          const currentDocumentDoc = this.allDocumentList[documentIndex];
          this.completePDFLoadingDetails.currentFileName = currentDocumentDoc.name;
          console.log(currentDocumentDoc);
          const url = currentDocumentDoc.url;
          this.completePDFClicked = true;
          this.completePDFLoadingDetails.progress = 0;
          this.completePDFLoadingDetails.progressText = "Fetching Assets";
          const imageData = this.allImagesData.notarySealImage;
          const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
          const pdfDoc = await PDFDocument.load(existingPdfBytes);
          const pages = pdfDoc.getPages();
          console.log(pages);
          const pngUrl = "https://app.bluenotary.us/icons/check-icon.png";
          const pngImageBytes = await fetch(pngUrl).then((res2) => res2.arrayBuffer());
          const pngImage = await pdfDoc.embedPng(pngImageBytes);
          let notarySealImage = false;
          this.completePDFLoadingDetails.progress = 0.1;
          this.completePDFLoadingDetails.progressText = "Fetching More Assets";
          if (this.isValidHttpUrl(imageData)) {
            const arrayBuffer = await fetch(`https://cors-fix.web.app/v1?url=${imageData}`).then((res) => res.arrayBuffer());
            if (imageData.includes(".png")) {
              notarySealImage = await pdfDoc.embedPng(btoa(String.fromCharCode(...new Uint8Array(arrayBuffer))));
            } else {
              notarySealImage = await pdfDoc.embedJpg(btoa(String.fromCharCode(...new Uint8Array(arrayBuffer))));
            }
          } else if (imageData) {
            notarySealImage = await pdfDoc.embedPng(imageData);
          }
          const firstPage = pages[0];
          for (let pagenum = 0; pagenum < this.emptyPagesAdded; pagenum += 1) {
            const addedPage = pdfDoc.addPage([firstPage.getWidth(), firstPage.getHeight()]);
            pages.push(addedPage);
          }
          const notaryCertificateImages = {};
          await Promise.all(_.map(this.allDroppedElementsDocIdWise[currentDocumentDoc._id], async (droppedElement) => {
            if (droppedElement.fieldType === "notary_certificate" && droppedElement.imageData) {
              let notaryCertificateBuffer = false;
              let { fieldHeight, fieldWidth } = droppedElement;
              if (fieldHeight) {
                fieldHeight = parseInt(fieldHeight.replace("px", ""), 10);
              }
              if (fieldWidth) {
                fieldWidth = parseInt(fieldWidth.replace("px", ""), 10);
              }
              if (droppedElement.imageData.includes(".png")) {
                notaryCertificateBuffer = await this.downscaleImage(droppedElement.imageData, "image/png", 0.7, fieldHeight, fieldWidth);
                notaryCertificateBuffer = await pdfDoc.embedPng(notaryCertificateBuffer);
              } else {
                notaryCertificateBuffer = await this.downscaleImage(droppedElement.imageData, "image/jpeg", 0.7, fieldHeight, fieldWidth);
                notaryCertificateBuffer = await pdfDoc.embedJpg(notaryCertificateBuffer);
              }
              notaryCertificateImages[droppedElement.elementId] = notaryCertificateBuffer;
            }
          }));
          _.map(this.allDroppedElementsDocIdWise[currentDocumentDoc._id], async (droppedElement) => {
            console.log(JSON.parse(JSON.stringify(droppedElement)));
            if (!droppedElement) {
              return;
            }
            const pageNumber = parseInt(droppedElement.page, 10);
            const currentPage = pages[pageNumber - 1];
            let { height, width } = currentPage.getSize();
            if (height) {
              height = firstPage.getHeight();
              width = firstPage.getWidth();
            }
            const canvasPageDiv = $(`.pdf-page[id="${String(pageNumber)}"]`);
            const canvasWidth = canvasPageDiv.attr("width");
            const canvasHeight = canvasPageDiv.attr("height");
            const widthRatio = parseInt(canvasWidth) / width;
            const heightRatio = parseInt(canvasHeight) / height;

            const posY = (height - (droppedElement.y / heightRatio));
            const posX = (droppedElement.x / widthRatio);
            // const posY = (height - (droppedElement.y / heightRatio)) - valueToSubtractFromY;
            // const posX = (droppedElement.x / widthRatio) - valueToSubtractFromX;
            let { fieldHeight, fieldWidth } = droppedElement;
            console.log(height, droppedElement.y, heightRatio, posY, fieldHeight);
            // console.log(droppedElement.x, posX, widthRatio, canvasWidth, width, valueToSubtractFromX, droppedFieldWidth);

            if (fieldHeight) {
              fieldHeight = parseInt(fieldHeight.replace("px", ""), 10);
            }
            if (fieldWidth) {
              fieldWidth = parseInt(fieldWidth.replace("px", ""), 10);
            }
            console.log(fieldWidth);
            if (droppedElement.fieldType === "checkmark") {
              currentPage.drawImage(pngImage, {
                x: posX,
                // x: posX - fieldWidth,
                // x: posX - 5,
                y: posY - (fieldHeight) + 5,
                // y: posY - fieldHeight / 2,
                width: 18,
                height: 18,
                color: droppedElement.color,
              });
            } else if (droppedElement.fieldType === "signature" || droppedElement.fieldPlaceholderType === "signature") {
              const signatureImage = await pdfDoc.embedPng(droppedElement.imageData);
              currentPage.drawImage(signatureImage, {
                x: posX,
                y: posY - (fieldHeight / heightRatio),
                width: fieldWidth / widthRatio,
                height: fieldHeight / heightRatio,
                color: droppedElement.color,
              });
            } else if (droppedElement.fieldType === "input_text" || droppedElement.fieldPlaceholderType === "input_text") {
              let valueToSubtract = 8;
              if (droppedElement.fieldPlaceholderType === "input_text") {
                valueToSubtract = 0;
              }
              currentPage.drawText(droppedElement.inputTextValue, {
                // x: posX + 10,
                // y: posY,
                x: posX,
                y: posY - (droppedElement.size / heightRatio) - valueToSubtract,
                size: droppedElement.size,
                lineHeight: droppedElement.size,
                maxWidth: fieldWidth / widthRatio
                // color: droppedElement.color,
              });
            } else if (droppedElement.fieldType === "image") {
              if (notarySealImage) {
              let textLeftPadding = 0;
              if (fieldWidth > 250) {
                textLeftPadding = (fieldWidth - 250) / 2;
              }
              console.log(textLeftPadding);
                currentPage.drawText("Notarized online using audio-video communication", {
                  x: posX + textLeftPadding,
                  y: posY - 9,
                  size: 9,
                  lineHeight: 9,
                  maxWidth: parseInt(fieldWidth, 10)
                  // color: droppedElement.color,
                });
                currentPage.drawImage(notarySealImage, {
                  x: posX,
                  y: posY - (fieldHeight / (heightRatio)),
                  width: fieldWidth / widthRatio,
                  height: (fieldHeight - 15) / heightRatio
                });
              }
            } else if (droppedElement.fieldType === "notary_certificate") {
              console.log("notary cert called");
              if (notaryCertificateImages[droppedElement.elementId]) {
                currentPage.drawImage(notaryCertificateImages[droppedElement.elementId], {
                  x: posX,
                  y: posY - (fieldHeight / (heightRatio)),
                  width: fieldWidth / widthRatio,
                  height: fieldHeight / heightRatio
                });
              }
            } else if (droppedElement.fieldType === "whiteout") {
              currentPage.drawRectangle({
                x: posX,
                y: posY - (fieldHeight / (heightRatio)),
                width: fieldWidth / widthRatio,
                height: fieldHeight / heightRatio,
                color: rgb(1, 1, 1)
              });
            } else {
              currentPage.drawText(droppedElement.text, {
                x: posX,
                y: posY - (fieldHeight / 2),
                size: droppedElement.size,
                lineHeight: droppedElement.size,
                // maxWidth: parseInt(fieldWidth, 10)
                // color: droppedElement.color,
              });
            }
          });

          this.completePDFLoadingDetails.progress = 0.2;
          this.completePDFLoadingDetails.progressText = "Building Final Document";

          pdfDoc.save().then(async (pdfBytes) => {
            this.outputFileObject = new Blob([pdfBytes], { type: "application/pdf" });
            // const fileURL = URL.createObjectURL(this.outputFileObject);
            // window.open(fileURL);
            // Commenting the code to open in new tab
            if (this.sessionid === "simulator") {
              const fileURL = URL.createObjectURL(this.outputFileObject);
              window.open(fileURL);
            }
            if (this.sessionid && this.sessionid !== "simulator") {
              const saveUrl = `session/savePDFEditingPage/${this.sessionid}`;
              const dataToSave = {
                droppedElements: _.uniqBy(_.compact(this.allDroppedElementsDocIdWise[currentDocumentDoc._id]), "elementId"),
                droppedElementsDocIdWise: finalAllDroppedElementsDocIdWise,
                notorizationType: this.notorizationType.join(),
                attachCertificate: this.attachCertificate,
                finalCostOfNotarization: this.finalCostOfNotarization,
                costOfNotarization: this.costOfNotarization,
                emptyPagesAdded: this.emptyPagesAdded
              };
              this.completePDFLoadingDetails.progress = 0.3;
              this.completePDFLoadingDetails.progressText = "Saving Elements";
              const response = await this.axios.post(saveUrl, dataToSave, {
                headers: {
                  "Content-Type": "application/json",
                },
              });
              console.log(response);
              console.log(window.stopCallback);
              if (window.stopCallback) {
                let firstDocument = false;
                if (documentIndex === 0) {
                  firstDocument = true;
                }
                let lastDocument = false;
                if (documentIndex === this.allDocumentList.length - 1) {
                  lastDocument = true;
                }
                await window.stopCallback("success", firstDocument, lastDocument, currentDocumentDoc._id);
              } else {
                this.completePDFLoadingModal = false;
                this.socketRequest("session_completed");
                this.endVideoCall();
                this.$router.replace(`/notary/my-sessions?confirmationSession=${this.sessionid}&paymentDone=true`);
              }
            } else {
              this.completePDFLoadingDetails.progress = 1;
              this.completePDFLoadingDetails.progressText = "Simulator Final Draft Generated, and opened in new tab.";
              setTimeout(() => {
                this.endVideoCall();
                this.completePDFLoadingModal = false;
                this.$router.replace("/notary/dashboard");
              }, 7000);
            }
          });

          // this.$q.notify({
          //   message: "Session Completed Successfully.",
          //   color: "black"
          // });
        }
      });
    },

    renderPdf (currentDocumentCopy) {
      const vm = this;
      // this.currentDocumentSelected
      // documentFileCacheById
      if (this.documentFileCacheById[currentDocumentCopy._id]) {
        if (currentDocumentCopy._id !== this.currentDocumentSelected._id) {
          return;
        }
        this.renderPdfIntermediate(this.documentFileCacheById[currentDocumentCopy._id]);
        return;
      }
      pdfjsLib.getDocument(this.pdfUrl).promise.then((pdf) => {
        this.documentFileCacheById[currentDocumentCopy._id] = pdf;
        if (currentDocumentCopy._id !== this.currentDocumentSelected._id) {
          return;
        }
        this.renderPdfIntermediate(pdf);
      }).catch((err) => {
        console.log("Error fetching the document: ", err);
        vm.isLoading = false;
        vm.docFound = false;
        vm.docNotFoundError = err.message;
      });
    },
    renderPdfIntermediate(pdf) {
      const vm = this;
      vm.pdfLoaded = true;
      let pageNo = 1;
      vm.totalPages = pdf.numPages;
      const pdfContainerTop = document.getElementById("pdf-pages-container");
      if (pdfContainerTop) {
        pdfContainerTop.innerHTML = "";
      }
      setTimeout(function createCanvas () {
        const pdfContainer = document.getElementById("pdf-pages-container");
        // pdfContainer.innerHTML = "";
        // const pdfIndexContainer = document.getElementById("pdf-index-container");
        pdf.getPage(pageNo).then((page) => {
          // create new canvas using PDF page dimensions
          const viewport = page.getViewport({ scale: vm.SCALE });
          if (pageNo === 1) {
            vm.firstPageViewPort = viewport;
          }
          const newCanvas = vm.getNewCanvas(page.pageNumber, viewport);
          const context = newCanvas.getContext("2d");
          // create canvas container
          const canvasContainer = vm.getNewCanvasContainer(page.pageNumber, "page");
          canvasContainer.append(newCanvas);
          pdfContainer.append(canvasContainer);

          // Render PDF page into canvas context
          let renderContext = {
            canvasContext: context,
            viewport,
          };
          const pageRenderTask = page.render(renderContext);
          pageRenderTask.promise.then();
          // create new canvas for index of pdf pages
          const pageIndexViewport = page.getViewport({ scale: vm.SMALL_SCALE });
          const pageIndexCanvas = vm.getNewCanvas(page.pageNumber, pageIndexViewport);
          const pageIndexContext = pageIndexCanvas.getContext("2d");

          // create canvas container for page index
          const pageIndexCanvasContainer = vm.getNewCanvasContainer(page.pageNumber, "pageIndex");
          pageIndexCanvasContainer.append(pageIndexCanvas);
          pageIndexCanvasContainer.append(vm.getPageTag(page.pageNumber));
          // pdfIndexContainer.append(pageIndexCanvasContainer);
          pageIndexCanvasContainer.addEventListener("click", (event) => {
            event.stopPropagation();
            const pageToMove = document.getElementById(`page${page.pageNumber}`);
            pageToMove.scrollIntoView();
          });

          // Render PDF page into canvas context
          renderContext = {
            canvasContext: pageIndexContext,
            viewport: pageIndexViewport,
          };
          const pageIndexRenderTask = page.render(renderContext);
          pageIndexRenderTask.promise.then(() => {
            if (page.pageNumber === pdf.numPages) {
              vm.isLoading = false;
            }
          });
          pageNo += 1;
          if (pageNo <= pdf.numPages) {
            createCanvas();
          }
        });
      }, 1000);
      setTimeout(() => {
        const pdfContainer = document.getElementById("pdf-pages-container");
        for (let pagenum = 0; pagenum < this.emptyPagesAdded; pagenum += 1) {
          this.totalPages += 1;
          const currentPage = this.totalPages;
          const newCanvas = this.getNewCanvas(currentPage, this.firstPageViewPort);
          $(newCanvas).css("background-color", "white");
          const canvasContainer = this.getNewCanvasContainer(currentPage, "page");
          canvasContainer.append(newCanvas);
          pdfContainer.append(canvasContainer);
        }
        setTimeout(() => {
          let droppedElements = (vm.sessionFullData && vm.sessionFullData.pdfDroppedElementDatas && vm.sessionFullData.pdfDroppedElementDatas.droppedElements) || [];
          if (this.allDroppedElementsDocIdWise && this.allDroppedElementsDocIdWise[this.currentDocumentSelected._id] && this.allDroppedElementsDocIdWise[this.currentDocumentSelected._id].length) {
            droppedElements = this.allDroppedElementsDocIdWise[this.currentDocumentSelected._id];
          }
          if (!vm.renderingSocketFields && droppedElements && droppedElements.length) {
            // this.allDroppedElementsDocIdWise
            console.log("droppedElements", droppedElements);
            _.map(droppedElements, (droppedElement) => {
              vm.createNewSignatureElement(droppedElement, false, true);
            });
            if (this.sendFullSessionFieldsIfDataFound) {
              this.sendFullSessionFields();
            }
          }
        }, 1000);
      }, 2000);
    },
    async saveTemplateFields() {
      const saveUrl = "notary/templateUpdatePdfDroppedElements";
      // allDroppedElementsDocIdWise
      const finalAllDroppedElementsDocIdWise = {};
      _.map(this.allDroppedElementsDocIdWise, (tempAllDroppedElements, docId) => {
        finalAllDroppedElementsDocIdWise[docId] = _.uniqBy(_.compact(tempAllDroppedElements), "elementId");
      });
      const dataToSave = {
        templateId: this.sessionid,
        droppedElements: _.uniqBy(_.compact(this.allDroppedElements), "elementId"),
        droppedElementsDocIdWise: finalAllDroppedElementsDocIdWise
      };
      const response = await this.axios.post(saveUrl, dataToSave, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      this.endVideoCall();
      this.$router.replace("/notary/templates");
    },
    cancelTemplateFields() {
      this.endVideoCall();
      this.$router.replace("/notary/templates");
    },
    async addWitnessClicked() {
      this.showAddWitnessModal = true;
      const getUrl = "session/getAllWitnessDetails";
      const response = await this.axios.get(getUrl);
      const allData = (response && response.data && response.data.allWitnessDocs) || [];
      this.witnessSelectionOptions.data = _.map(allData, (tempWitnessDoc) => {
        tempWitnessDoc.label = `${tempWitnessDoc.firstName} ${tempWitnessDoc.lastName}`;
        tempWitnessDoc.value = tempWitnessDoc._id;
        return tempWitnessDoc;
      });
      this.witnessSelectionOptions.dataFetched = true;
      this.witnessSelectionOptions.loading = false;
    },
    async addWitnessSaveClicked() {
      console.log(this.currentWitnessModal);
      const saveUrl = "session/addWitnessDuringSession";
      const dataToSave = {
        sessionid: this.sessionid
      };
      if (this.witnessSelectionType === "old_witness") {
        console.log("this.witnessSelectionOptions.selectedValue", this.witnessSelectionOptions.selectedValue);
        if (!this.witnessSelectionOptions.selectedValue._id) {
          this.$q.notify({
            color: "red",
            position: "bottom-right",
            message: "Please select a witness to add to the session",
          });
          return;
        }
        dataToSave.witnessDetails = {
          id: this.witnessSelectionOptions.selectedValue._id
        };
      } else if (this.witnessSelectionType === "bn_witness_open_call") {
        dataToSave.witnessDetails = {
          witnessSelectionType: "bn_witness_open_call"
        };
      } else {
        let fieldNotFilled = false;
        _.map(this.currentWitnessModal, (witnessValue, witnessField) => {
          if (!witnessValue) {
            fieldNotFilled = witnessField;
          }
        });
        if (fieldNotFilled) {
          this.$q.notify({
            color: "red",
            position: "bottom-right",
            message: `${fieldNotFilled} is a required field`,
          });
          return;
        }
        dataToSave.witnessDetails = this.currentWitnessModal;
      }
      const response = await this.axios.post(saveUrl, dataToSave, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.showAddWitnessModal = false;
      let notifyMessage = "Witness added Successfully";
      if (this.witnessSelectionType === "bn_witness_open_call") {
        notifyMessage = "An Open call for BN Witness is sent. If someone is available, they will join";
      }
      this.$q.notify({
        color: "primary",
        position: "bottom-right",
        message: notifyMessage,
      });
      if (this.witnessSelectionType === "bn_witness_open_call") {
        const dataToSend = {
          sessionid: this.sessionid
        };
        if (window.currentSocket) {
          window.currentSocket.emit("serverSessionActivityChanged", dataToSend, (res) => {
            console.log("res", res);
          });
        }
      } else {
        this.getSessionWitnessDetails();
        this.socketRequest("session_witness_management_changed");
      }
      console.log(response);
    },
    documentPickerNavigationButtonClicked(direction) {
      let documentIndex = false;
      let localIndex = 0;
      _.map(this.allDocumentList, (tempDocumentDoc) => {
        if (tempDocumentDoc._id === this.currentDocumentSelected._id) {
          documentIndex = localIndex;
        }
        localIndex += 1;
      });
      if (direction === "prev") {
        documentIndex -= 1;
      } else {
        documentIndex += 1;
      }
      this.currentDocumentSelected = this.allDocumentList[documentIndex];
    },
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.fieldheader {
  font-weight: bold;
  padding-left: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid black;
}
[draggable="true"] {
  cursor: move;
}
.icardimg {
  max-height: 600px;
}
.signature-element {
  touch-action: none;
}
</style>
