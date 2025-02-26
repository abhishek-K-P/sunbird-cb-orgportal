import { BulkUploadComponent } from './bulk-upload.component'
import { FileService } from '../../../../../users/services/upload.service'
import { UsersService } from '../../../../../users/services/users.service'
import { ActivatedRoute } from '@angular/router'
import { DesignationsService } from '../../services/designations.service'
import { of, throwError } from 'rxjs'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'

describe('BulkUploadComponent', () => {
  let component: BulkUploadComponent
  let fileService: FileService
  let matSnackBar: MatSnackBar
  let matDialog: MatDialog
  let usersService: UsersService
  let activateRoute: ActivatedRoute
  let designationsService: DesignationsService

  beforeEach(() => {
    fileService = {
      getBulkDesignationUploadData: jest.fn(),
      validateExcelFile: jest.fn(),
      downloadWithDispositionName: jest.fn(),
      bulkUploadDesignation: jest.fn(),
      downloadBulkUploadSampleFile: jest.fn(),
    } as unknown as FileService

    matSnackBar = { open: jest.fn() } as unknown as MatSnackBar
    matDialog = { open: jest.fn() } as unknown as MatDialog
    usersService = { sendOtp: jest.fn() } as unknown as UsersService
    activateRoute = { snapshot: { data: { configService: {} } } } as unknown as ActivatedRoute
    designationsService = { frameWorkInfo: { code: 'test-framework' } } as unknown as DesignationsService

    component = new BulkUploadComponent(
      fileService,
      matSnackBar,
      matDialog,
      usersService,
      activateRoute,
      designationsService
    )
  })

  describe('ngOnInit', () => {
    it('should call getBulkStatusList', () => {
      const spy = jest.spyOn(component, 'getBulkStatusList')
      component.ngOnInit()
      expect(spy).toHaveBeenCalled()
    })

    it('should subscribe to activatedRoute data', () => {
      const mockData = { pageData: { data: { bulkUploadConfig: { pageSize: 10, pageSizeOptions: [10, 20] } } } }
      activateRoute.data = of(mockData)
      component.ngOnInit()
      expect(component.bulkUploadConfig).toEqual(mockData.pageData.data.bulkUploadConfig)
      expect(component.pageSize).toBe(10)
      expect(component.sizeOptions).toEqual([10, 20])
    })
  })

  describe('getBulkStatusList', () => {
    it('should fetch and sort bulk status list successfully', () => {
      const mockResponse = { result: { content: [{ dateCreatedOn: '2025-01-01' }, { dateCreatedOn: '2025-01-02' }] } }
      jest.spyOn(fileService, 'getBulkDesignationUploadData').mockReturnValue(of(mockResponse))

      component.getBulkStatusList()

      expect(fileService.getBulkDesignationUploadData).toHaveBeenCalledWith(component.rootOrgId)
      expect(component.lastUploadList.length).toBe(2)
      expect(component.lastUploadList[0].dateCreatedOn).toBe('2025-01-02')
    })

    it('should show an error message on failure', () => {
      const mockError = { ok: false }
      jest.spyOn(fileService, 'getBulkDesignationUploadData').mockReturnValue(throwError(mockError))

      component.getBulkStatusList()

      expect(matSnackBar.open).toHaveBeenCalledWith('Unable to get Bulk status list')
    })
  })

  describe('handleFileChange', () => {
    it('should set fileName, fileType, and fileSelected if file is valid', () => {
      const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      jest.spyOn(fileService, 'validateExcelFile').mockReturnValue(true)

      component.handleOnFileChange([file])

      expect(component.fileName).toBe('test.xlsx')
      expect(component.fileType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      expect(component.fileSelected).toBe(file)
      expect(component.showFileError).toBe(false)
    })

    it('should set showFileError to true if file is invalid', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      jest.spyOn(fileService, 'validateExcelFile').mockReturnValue(false)

      component.handleOnFileChange([file])

      expect(component.showFileError).toBe(true)
    })
  })

  describe('sendOTP', () => {
    it('should call generateAndVerifyOTP with correct contactType', () => {
      const spy = jest.spyOn(component, 'generateAndVerifyOTP')
      component.userProfile = { email: 'test@example.com' }
      component.sendOTP()
      expect(spy).toHaveBeenCalledWith('email')
    })
  })

  describe('generateAndVerifyOTP', () => {
    it('should send OTP and handle success and failure', () => {
      const mockResponse = {}
      jest.spyOn(usersService, 'sendOtp').mockReturnValue(of(mockResponse))

      component.generateAndVerifyOTP('email')

      expect(usersService.sendOtp).toHaveBeenCalledWith('test@example.com', 'email')
      expect(matSnackBar.open).toHaveBeenCalledWith('An OTP has been sent to your Email address, (Valid for 15 min\'s)')
    })

    it('should show error message on OTP failure', () => {
      const mockError = { ok: false, error: { params: { errmsg: 'OTP error' } } }
      jest.spyOn(usersService, 'sendOtp').mockReturnValue(throwError(mockError))

      component.generateAndVerifyOTP('email')

      expect(matSnackBar.open).toHaveBeenCalledWith('OTP error')
    })
  })

  describe('uploadCSVFile', () => {
    it('should call fileService.bulkUploadDesignation and handle success', () => {
      const mockFormData = new FormData()
      jest.spyOn(fileService, 'validateExcelFile').mockReturnValue(true)
      jest.spyOn(fileService, 'bulkUploadDesignation').mockReturnValue(of({}))

      component.fileSelected = new File(['test'], 'test.xlsx')
      component.uploadCSVFile()

      expect(fileService.bulkUploadDesignation).toHaveBeenCalledWith(
        component.fileName,
        mockFormData,
        component.bulkUploadFrameworkId,
        component.rootOrgId
      )
      expect(matSnackBar.open).toHaveBeenCalledWith('File uploaded successfully!')
    })

    it('should show error message on upload failure', () => {
      const mockError = { ok: false }
      jest.spyOn(fileService, 'bulkUploadDesignation').mockReturnValue(throwError(mockError))

      component.uploadCSVFile()

      expect(matSnackBar.open).toHaveBeenCalledWith('Uploading CSV file failed due to some error, please try again later!')
    })
  })
})
