import { BulkUploadComponent } from './bulk-upload.component'
import { FileService } from '../../../../../users/services/upload.service'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { UsersService } from '../../../../../users/services/users.service'
import { DesignationsService } from '../../services/designations.service'
import { ActivatedRoute } from '@angular/router'

jest.mock('../../../../../users/services/upload.service')
jest.mock('@angular/material/legacy-snack-bar')
jest.mock('@angular/material/legacy-dialog')
jest.mock('../../../../../users/services/users.service')
jest.mock('../../services/designations.service')
jest.mock('@angular/router', () => ({
  ActivatedRoute: jest.fn()
}))

describe('BulkUploadComponent', () => {
  let component: BulkUploadComponent
  let fileServiceMock: jest.Mocked<FileService>
  let matSnackBarMock: jest.Mocked<MatSnackBar>
  let matDialogMock: jest.Mocked<MatDialog>
  let usersServiceMock: jest.Mocked<UsersService>
  let designationsServiceMock: jest.Mocked<DesignationsService>
  let activatedRouteMock: jest.Mocked<ActivatedRoute>

  beforeEach(() => {
    // Create mock instances for the services
    fileServiceMock = new FileService(null as any, null as any) as jest.Mocked<FileService>
    matSnackBarMock = new MatSnackBar(null as any, null as any, null as any, null as any, null as any, null as any) as jest.Mocked<MatSnackBar>
    matDialogMock = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any) as jest.Mocked<MatDialog>
    usersServiceMock = new UsersService(null as any) as jest.Mocked<UsersService>
    designationsServiceMock = new DesignationsService(null as any, null as any) as jest.Mocked<DesignationsService>
    // activatedRouteMock = new ActivatedRoute()

    // // Assign mock data to ActivatedRoute snapshot
    // activatedRouteMock.snapshot = {
    //   data: { configService: { userProfile: { rootOrgId: 'testRootOrgId' } } }
    // }

    // Create an instance of the component
    component = new BulkUploadComponent(
      fileServiceMock,
      matSnackBarMock,
      matDialogMock,
      usersServiceMock,
      activatedRouteMock,
      designationsServiceMock
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // Test: Component Initialization
  it('should initialize the component and fetch bulk status list', () => {
    const mockBulkStatusList = [{ fileName: 'file1.xlsx', dateCreatedOn: '2025-01-01' }]
    // fileServiceMock.getBulkDesignationUploadData.mockReturnValue({
    //   pipe: jest.fn().mockReturnValue({ subscribe: jest.fn((callback) => callback({ result: { content: mockBulkStatusList } })) })
    // })

    component.ngOnInit()

    expect(fileServiceMock.getBulkDesignationUploadData).toHaveBeenCalledWith('testRootOrgId')
    expect(component.lastUploadList).toEqual(mockBulkStatusList)
  })

  // Test: onChangePage method
  it('should handle page change correctly', () => {
    // const pageEvent = { pageIndex: 2, pageSize: 10 }
    // component.onChangePage(pageEvent)

    expect(component.startIndex).toBe(20)
    expect(component.lastIndex).toBe(30)
  })

  // Test: showFileUploadProgress method
  it('should open the file progress dialog', () => {
    component.showFileUploadProgress()

    expect(matDialogMock.open).toHaveBeenCalledWith(expect.any(Function), {
      data: {},
      disableClose: true,
      panelClass: 'progress-modal',
    })
  })

  // Test: handleFileClick method
  it('should reset the file input value on file click', () => {
    const mockEvent = { target: { value: 'test-file.txt' } }
    component.handleFileClick(mockEvent)

    expect(mockEvent.target.value).toBe('')
  })

  // Test: handleFileChange method (valid file type)
  it('should set file data when a valid file is selected', () => {
    const validFile = new File(['content'], 'test-file.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const mockEvent = { target: { files: [validFile] } }
    fileServiceMock.validateExcelFile.mockReturnValue(true)

    component.handleOnFileChange(mockEvent.target.files)

    expect(component.fileName).toBe(validFile.name)
    expect(component.fileType).toBe(validFile.type)
    expect(component.fileSelected).toBe(validFile)
    expect(component.showFileError).toBe(false)
  })

  // Test: handleFileChange method (invalid file type)
  it('should set showFileError to true when an invalid file is selected', () => {
    const invalidFile = new File(['content'], 'test-file.txt', { type: 'text/plain' })
    const mockEvent = { target: { files: [invalidFile] } }
    fileServiceMock.validateExcelFile.mockReturnValue(false)

    component.handleOnFileChange(mockEvent.target.files)

    expect(component.showFileError).toBe(true)
  })

  // Test: sendOTP method
  it('should send OTP based on email or phone', () => {
    component.userProfile = { email: 'test@example.com' }
    // usersServiceMock.sendOtp.mockReturnValue({
    //   pipe: jest.fn().mockReturnValue({ subscribe: jest.fn((callback) => callback({})) })
    // })

    component.sendOTP()

    expect(usersServiceMock.sendOtp).toHaveBeenCalledWith('test@example.com', 'email')
  })

  // Test: handleDownloadFile method
  it('should trigger file download for bulk status', () => {
    //const mockFile = { fileName: 'test-file.xlsx' }
    fileServiceMock.getBulkDesignationStatus.mockReturnValue('test/path/to/file')

    // component.handleDownloadFile(mockFile)

    expect(fileServiceMock.downloadWithDispositionName).toHaveBeenCalledWith('test/path/to/file')
  })

  // Test: ngOnDestroy method
  it('should clean up resources on destroy', () => {
    component.interval = setInterval(() => { }, 1000)
    component.ngOnDestroy()

    //  expect(component.destroySubject$.unsubscribe).toHaveBeenCalled()
    expect(clearInterval).toHaveBeenCalledWith(component.interval)
  })
})
