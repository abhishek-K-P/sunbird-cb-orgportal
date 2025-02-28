import { of, throwError } from 'rxjs'
import { ProfleApprovalBulkUploadComponent } from './profle-approval-bulk-upload.component'

describe('ProfleApprovalBulkUploadComponent', () => {
    let component: ProfleApprovalBulkUploadComponent
    let mockFb: any
    let mockFileService: any
    let mockSnackBar: any
    let mockRoute: any
    let mockDatepipe: any
    let mockUsersSvc: any

    beforeEach(() => {
        mockFb = {
            group: jest.fn().mockReturnValue({
                patchValue: jest.fn(),
                get: jest.fn().mockReturnValue({
                    setValue: jest.fn(),
                    valueChanges: of(null)
                }),
                controls: {
                    file: {
                        setValue: jest.fn()
                    }
                },
                reset: jest.fn()
            })
        }

        mockFileService = {
            isLoading: jest.fn().mockReturnValue(of(false)),
            getBulkApprovalUploadDataV1: jest.fn().mockReturnValue(of({
                result: {
                    content: [
                        {
                            filename: 'test.csv',
                            status: 'SUCCESS',
                            failedrecordscount: 0,
                            successfulrecordscount: 10,
                            totalrecords: 10,
                            datecreatedon: '2025-02-28',
                            dateupdatedon: '2025-02-28'
                        }
                    ]
                }
            })),
            validateFile: jest.fn().mockReturnValue(true),
            uploadApproval: jest.fn().mockReturnValue(of({ message: 'File uploaded successfully!' })),
            download: jest.fn(),
            downloadReport: jest.fn()
        }

        mockSnackBar = {
            open: jest.fn()
        }

        mockRoute = {
            data: of({
                pageData: {
                    data: {
                        downloadSampleFilePath: '/path/to/sample',
                        downloadAsFileName: 'sample.csv',
                        defaultValuesFilePath: '/path/to/defaults',
                        defaultValuesFileName: 'defaults.csv'
                    }
                }
            }),
            snapshot: {
                parent: {
                    data: {
                        configService: {
                            unMappedUser: {
                                rootOrg: {
                                    rootOrgId: 'org123'
                                }
                            },
                            userProfileV2: {
                                email: 'test@example.com',
                                mobile: '1234567890'
                            },
                            userRoles: new Set(['admin'])
                        }
                    }
                }
            }
        }

        mockDatepipe = {
            transform: jest.fn()
        }

        mockUsersSvc = {
            sendOtp: jest.fn().mockReturnValue(of({ result: { response: 'SUCCESS' } })),
            resendOtp: jest.fn().mockReturnValue(of({ result: { response: 'SUCCESS' } })),
            verifyOTP: jest.fn().mockReturnValue(of({ result: { response: 'SUCCESS' } }))
        }

        component = new ProfleApprovalBulkUploadComponent(
            mockFb,
            mockFileService,
            mockSnackBar,
            mockRoute,
            mockDatepipe,
            mockUsersSvc
        )

        // Mock ElementRef
        component.toastSuccess = { nativeElement: { value: 'Success message' } }
        component.toastError = { nativeElement: { value: 'Error message' } }

        // Mock MatSort
        component.sort = { active: '', start: '', direction: '' } as any

        // Mock paginator
        component.paginator = {
            pageIndex: 0,
            pageSize: 10,
            page: of({})
        } as any

        // Mock dataSource
        component.dataSource = {
            paginator: null,
            sort: null
        } as any

        jest.spyOn(window, 'alert').mockImplementation(() => { })
        jest.spyOn(window, 'open').mockImplementation(() => null)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('ngOnInit', () => {
        it('should initialize component properties and fetch bulk upload data', () => {
            component.ngOnInit()

            expect(component.displayLoader).toBeDefined()
            expect(mockFileService.getBulkApprovalUploadDataV1).toHaveBeenCalled()
            expect(component.registrationForm.get('email')?.value).toBe('test@example.com')
            expect(component.registrationForm.get('mobile')?.value).toBe('1234567890')
        })
    })

    describe('getBulkUploadData', () => {
        it('should fetch bulk upload data and update the data source', () => {
            component.getBulkUploadData()

            expect(mockFileService.getBulkApprovalUploadDataV1).toHaveBeenCalled()
            expect(component.bulkUploadData).toBeDefined()
            expect(component.fetching).toBe(false)
            expect(component.tableList.length).toBe(1)
        })

        it('should handle empty result', () => {
            mockFileService.getBulkApprovalUploadDataV1.mockReturnValue(of({}))

            component.getBulkUploadData()

            expect(component.fetching).toBe(false)
            expect(component.bulkUploadData).toBeUndefined()
        })
    })

    describe('onFileChange', () => {
        it('should update file name and form value when file is selected', () => {
            const mockFile = new File(['content'], 'test.csv', { type: 'text/csv' })
            const mockEvent = {
                target: {
                    files: [mockFile]
                }
            }

            component.onFileChange(mockEvent)

            expect(component.fileName).toBe('test.csv')
            expect(component.fileSelected).toBe(mockFile)
            expect(component.formGroup.patchValue).toHaveBeenCalled()
        })
    })

    describe('cancelSelected', () => {
        it('should reset file selection and form values', () => {
            component.fileName = 'test.csv'
            component.fileSelected = 'file'

            component.cancelSelected()

            expect(component.fileName).toBe('')
            expect(component.fileSelected).toBe('')
            expect(component.formGroup.controls['file'].setValue).toHaveBeenCalledWith('')
        })
    })

    describe('onSubmit', () => {
        it('should upload file when form is valid and file type is valid', () => {
            component.fileName = 'test.csv'
            component.fileSelected = new File(['content'], 'test.csv', { type: 'text/csv' })

            component.onSubmit({ file: { value: 'test.csv' } })

            expect(mockFileService.validateFile).toHaveBeenCalledWith('test.csv')
            expect(mockFileService.uploadApproval).toHaveBeenCalled()
            expect(mockSnackBar.open).toHaveBeenCalledWith('File uploaded successfully!', 'X', { duration: 5000 })
            expect(component.formGroup.reset).toHaveBeenCalled()
        })

        it('should show error message when file type is invalid', () => {
            mockFileService.validateFile.mockReturnValue(false)
            component.fileName = 'test.exe'

            component.onSubmit({})

            expect(component.showFileError).toBe(true)
            expect(mockSnackBar.open).toHaveBeenCalledWith('Error message', 'X', { duration: 5000 })
        })

        it('should handle upload error', () => {
            mockFileService.uploadApproval.mockReturnValue(throwError({ error: 'Upload failed' }))
            component.fileName = 'test.csv'
            component.fileSelected = new File(['content'], 'test.csv', { type: 'text/csv' })

            component.onSubmit({})

            expect(mockSnackBar.open).toHaveBeenCalledWith('Error message', 'X', { duration: 5000 })
        })
    })

    describe('downloadFile', () => {
        it('should call fileService.download with correct parameters', () => {
            component.downloadSampleFilePath = '/path/to/sample'
            component.downloadAsFileName = 'sample.csv'

            component.downloadFile()

            expect(mockFileService.download).toHaveBeenCalledWith('/path/to/sample', 'sample.csv')
        })
    })

    describe('downloadDefaultValuesFile', () => {
        it('should call fileService.download with correct parameters', () => {
            component.defaultValuesFilePath = '/path/to/defaults'
            component.defaultValuesFileName = 'defaults.csv'

            component.downloadDefaultValuesFile()

            expect(mockFileService.download).toHaveBeenCalledWith('/path/to/defaults', 'defaults.csv')
        })
    })

    describe('downloadFullFile', () => {
        it('should open window with correct URL', () => {
            component.downloadFullFile({ row: { fileName: 'test.csv' } })

            expect(window.open).toHaveBeenCalledWith('/apis/proxies/v8/workflow/admin/bulkuploadfile/download/test.csv', '_blank')
        })
    })

    describe('emailVerification', () => {
        it('should validate email length correctly', () => {
            // Valid email
            component.emailVerification('test@example.com')
            expect(component.emailLengthVal).toBe(false)

            // Email with username part too long (>64)
            const longUsername = 'a'.repeat(65)
            component.emailVerification(`${longUsername}@example.com`)
            expect(component.emailLengthVal).toBe(true)

            // Email with domain part too long (>255)
            const longDomain = 'a'.repeat(256)
            component.emailVerification(`test@${longDomain}.com`)
            expect(component.emailLengthVal).toBe(true)
        })
    })

    describe('OTP functions', () => {
        it('should send OTP to mobile number', () => {
            component.userMobile = '1234567890'

            component.sendOtp()

            expect(mockUsersSvc.sendOtp).toHaveBeenCalledWith('1234567890', 'phone')
            expect(component.otpSend).toBe(true)
            expect(window.alert).toHaveBeenCalled()
        })

        it('should handle error when sending OTP to mobile', () => {
            mockUsersSvc.sendOtp.mockReturnValue(throwError({ error: { params: { errmsg: 'Failed to send OTP' } } }))
            component.userMobile = '1234567890'

            component.sendOtp()

            expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to send OTP')
        })

        it('should verify mobile OTP successfully', () => {
            component.userMobile = '1234567890'

            component.verifyOtp({ value: '1234' })

            expect(mockUsersSvc.verifyOTP).toHaveBeenCalledWith('1234', '1234567890', 'phone')
            expect(component.isMobileVerified).toBe(true)
        })

        it('should handle invalid OTP for mobile verification', () => {
            component.verifyOtp({ value: '' })

            expect(mockSnackBar.open).toHaveBeenCalledWith('Please enter a valid OTP.')
            expect(mockUsersSvc.verifyOTP).not.toHaveBeenCalled()
        })

        it('should send OTP to email', () => {
            component.userEmail = 'test@example.com'

            component.sendOtpEmail()

            expect(mockUsersSvc.sendOtp).toHaveBeenCalledWith('test@example.com', 'email')
            expect(component.otpEmailSend).toBe(true)
            expect(window.alert).toHaveBeenCalled()
        })

        it('should verify email OTP successfully', () => {
            component.userEmail = 'test@example.com'

            component.verifyOtpEmail({ value: '1234' })

            expect(mockUsersSvc.verifyOTP).toHaveBeenCalledWith('1234', 'test@example.com', 'email')
            expect(component.isEmailVerified).toBe(true)
        })
    })

    describe('resetOTPFields', () => {
        it('should reset all OTP-related fields', () => {
            component.isEmailVerified = true
            component.otpEmailSend = true
            component.isMobileVerified = true
            component.otpSend = true
            component.disableVerifyBtn = true

            component.resetOTPFields()

            expect(component.isEmailVerified).toBe(false)
            expect(component.otpEmailSend).toBe(false)
            expect(component.isMobileVerified).toBe(false)
            expect(component.otpSend).toBe(false)
            expect(component.disableVerifyBtn).toBe(false)
        })
    })

    describe('getKarmayogiLink', () => {
        it('should return correct link when user has public role', () => {
            // Already setup in the beforeEach with 'admin' role
            component.myRoles = new Set(['public'])

            expect(component.getKarmayogiLink).toContain('/app/user-profile/details')
        })

        it('should return empty string when user does not have public role', () => {
            component.myRoles = new Set(['admin'])

            expect(component.getKarmayogiLink).toBe('')
        })
    })
})